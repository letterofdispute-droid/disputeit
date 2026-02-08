

# Add Mobile Header Sign-In Indicator

## Issue
When a user is signed in and viewing the site on mobile, there is no visible indication in the header that they are logged in. The only elements visible are the logo and the hamburger menu icon. Users must open the menu to see their account information.

## Solution
Add a small user avatar with a green "online" dot next to the hamburger menu icon on mobile screens. This provides immediate visual feedback that the user is signed in.

## Visual Representation

**Before (Mobile Header - Signed In):**
```text
+----------------------------------------+
| [Logo]                        [≡ Menu] |
+----------------------------------------+
```

**After (Mobile Header - Signed In):**
```text
+----------------------------------------+
| [Logo]                   [👤●] [≡ Menu] |
+----------------------------------------+
```

The avatar will:
- Show the user's Google profile picture if available
- Fall back to showing their initials
- Include a small green dot indicating "signed in" status
- Be clickable to open the mobile menu

---

## Implementation Details

### File to Modify
`src/components/layout/Header.tsx`

### Changes
Add a mobile-only user indicator element between the logo and hamburger menu that is:
1. Only visible on mobile (`lg:hidden`)
2. Only shown when user is signed in
3. Displays a small avatar (28x28px) with initials fallback
4. Includes the green status dot
5. Tapping it opens the mobile menu sheet

### Code Change (lines 72-79)

```tsx
{/* Mobile menu */}
<div className="flex items-center gap-2 lg:hidden">
  {/* Mobile user indicator - only when signed in */}
  {user && (
    <button 
      onClick={() => setOpen(true)}
      className="flex items-center gap-1"
    >
      <Avatar className="h-7 w-7">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {profile?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
    </button>
  )}
  
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    </SheetTrigger>
    {/* ... rest of sheet content ... */}
  </Sheet>
</div>
```

---

## Technical Notes

- The avatar uses the same styling as the desktop `UserAccountMenu` for consistency
- The green dot matches the `emerald-500` color used elsewhere in the app
- Clicking the avatar opens the same mobile menu sheet, providing quick access to account options
- The indicator is compact (28px avatar) to fit well in the mobile header without crowding

