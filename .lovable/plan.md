

# Improve Logged-In User Indicator and Name Display

## Issues Identified

1. **No clear sign-in indicator** - When users log in and are redirected to the homepage, there's no obvious visual feedback that they are logged in
2. **Wrong name displayed for Google OAuth users** - The greeting says "Hello, [last name]" instead of "Hello, [first name]" for Google accounts

## Root Cause Analysis

### Issue 1: No User Indicator
Currently, the Header shows generic "Dashboard" and "Sign Out" buttons when logged in. There's no personalized element showing the user's name or avatar.

### Issue 2: Google OAuth Name Problem  
When a user signs in with Google, the user metadata contains:
- `full_name: "Mario Letterdispute"` 
- `name: "Mario Letterdispute"`
- NO `first_name` or `last_name` fields

The database trigger that creates profiles only looks for `first_name` and `last_name` in the metadata:
```sql
NEW.raw_user_meta_data->>'first_name',  -- NULL for Google users
NEW.raw_user_meta_data->>'last_name'    -- NULL for Google users
```

This means Google OAuth users get NULL values in their profile, and the Dashboard falls back to parsing the email address.

---

## Solution

### 1. Add User Account Dropdown to Header

Replace the current Dashboard/Sign Out buttons with a personalized user menu:

```text
Desktop:                              Mobile:
+----------------------------+        +------------------------+
| [Avatar] Mario ●           |        | [Avatar] ● Mario       |
+----------------------------+        | Dashboard              |
| Dashboard                  |        | Settings               |
| Settings                   |        | ---------------------- |
| Admin (if admin)           |        | Sign Out               |
| ----------------------     |        +------------------------+
| Sign Out                   |
+----------------------------+
```

Features:
- User avatar (from Google picture or initials fallback)
- First name displayed
- Green dot indicating online/signed-in status
- Dropdown menu with navigation options

### 2. Fix Profile Creation for OAuth Users

Update the database trigger to extract first name from multiple possible sources:

```sql
-- Priority order for first_name:
-- 1. first_name (email signup)
-- 2. Split from full_name or name (Google OAuth)

COALESCE(
  NEW.raw_user_meta_data->>'first_name',
  split_part(
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ), ' ', 1
  )
)
```

### 3. Backfill Existing OAuth Users

Run a one-time update to fix existing profiles that have NULL names:

```sql
UPDATE public.profiles p
SET 
  first_name = split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ' ', 1),
  last_name = split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ' ', 2)
FROM auth.users u
WHERE p.user_id = u.id
  AND p.first_name IS NULL
  AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.raw_user_meta_data->>'name' IS NOT NULL);
```

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Add UserAccountMenu component with avatar, name, green dot, dropdown |
| `src/hooks/useAuth.tsx` | Add profile data (first_name, avatar_url) to auth context |
| `supabase/migrations/new-migration.sql` | Update handle_new_user() trigger + backfill existing users |

### Header Changes (Desktop)

```tsx
{user ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="gap-2 px-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline-block">{firstName}</span>
        {/* Green online indicator */}
        <span className="h-2 w-2 rounded-full bg-green-500" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/dashboard">Dashboard</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/settings">Settings</Link>
      </DropdownMenuItem>
      {isAdmin && (
        <DropdownMenuItem asChild>
          <Link to="/admin">Admin</Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut}>
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  // Login / Create Letter buttons
)}
```

### Auth Context Enhancement

Add profile fetching to the auth context so first_name and avatar_url are available throughout the app:

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  profile: { first_name: string | null; avatar_url: string | null } | null;
  // ... methods
}
```

### Database Migration

```sql
-- 1. Update trigger to handle OAuth names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 2)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Backfill existing OAuth users
UPDATE public.profiles p
SET 
  first_name = COALESCE(p.first_name, split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ' ', 1)),
  last_name = COALESCE(p.last_name, split_part(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), ' ', 2)),
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data->>'picture', u.raw_user_meta_data->>'avatar_url')
FROM auth.users u
WHERE p.user_id = u.id
  AND p.first_name IS NULL
  AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.raw_user_meta_data->>'name' IS NOT NULL);
```

---

## Visual Result

**Before (logged in):**
```
[Logo]  [MegaMenu]                    [Dashboard] [Sign Out]
```

**After (logged in):**
```
[Logo]  [MegaMenu]                    [👤 Mario ●] ← clickable dropdown
```

The green dot provides instant visual confirmation that the user is signed in.

