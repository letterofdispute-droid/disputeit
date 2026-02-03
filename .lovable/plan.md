

# Account Settings Page Implementation

## Overview

Create a comprehensive Account Settings page at `/settings` where authenticated users can update their profile information, change their password, and manage account preferences. The page will be protected and accessible from the Dashboard.

---

## Page Structure

The settings page will use a tabbed interface with three main sections:

| Tab | Features |
|-----|----------|
| **Profile** | First name, last name, email (read-only), member since |
| **Security** | Change password (current + new + confirm) |
| **Preferences** | Email notifications toggle, account deletion option |

---

## Technical Implementation

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/SettingsPage.tsx` | Create | Main settings page component |
| `src/App.tsx` | Modify | Add protected route for `/settings` |
| `src/pages/Dashboard.tsx` | Modify | Link "Account Settings" card to `/settings` |

---

## Component Design

### SettingsPage Structure

```text
+--------------------------------------------------+
|  Account Settings                                |
|  Manage your profile and preferences             |
+--------------------------------------------------+
|  [Profile] [Security] [Preferences]              |
+--------------------------------------------------+
|                                                  |
|  Tab Content Area                                |
|  - Forms with validation                         |
|  - Save buttons per section                      |
|  - Success/error feedback via toast              |
|                                                  |
+--------------------------------------------------+
```

### Profile Tab
- **First Name** - Editable input
- **Last Name** - Editable input
- **Email** - Read-only display (from Supabase Auth)
- **Member Since** - Read-only display (profile.created_at)
- **Save Changes** button

### Security Tab
- **Current Password** - Required for verification
- **New Password** - Min 6 characters
- **Confirm New Password** - Must match new password
- **Update Password** button
- Uses `supabase.auth.updateUser({ password })` API

### Preferences Tab
- **Email Notifications** - Switch toggle (placeholder for future)
- **Delete Account** - Destructive action with confirmation dialog

---

## Data Flow

### Fetching Profile Data

```tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('first_name, last_name, email, created_at')
  .eq('user_id', user.id)
  .single();
```

### Updating Profile

```tsx
const { error } = await supabase
  .from('profiles')
  .update({ first_name, last_name })
  .eq('user_id', user.id);
```

### Changing Password

```tsx
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

---

## UI Components Used

- `Layout` - Consistent page wrapper
- `SEOHead` - Meta tags and canonical URL
- `Card`, `CardHeader`, `CardContent` - Section containers
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- `Input`, `Label` - Form fields
- `Button` - Actions
- `Switch` - Toggle preferences
- `AlertDialog` - Delete account confirmation
- `Separator` - Visual dividers
- Lucide icons: `User`, `Lock`, `Settings`, `Trash2`, `ArrowLeft`

---

## Validation

### Profile Update
- First/last name: Optional, max 50 characters each
- Trimmed before saving

### Password Change
- Current password: Required (not verified client-side, Supabase handles)
- New password: Min 6 characters
- Confirm password: Must match new password
- Show inline validation errors

---

## Route Configuration

### App.tsx Addition

```tsx
import SettingsPage from "./pages/SettingsPage";

// Inside Routes
<Route path="/settings" element={
  <ProtectedRoute><SettingsPage /></ProtectedRoute>
} />
```

### Dashboard Link Update

```tsx
<Link to="/settings">
  <Card className="cursor-pointer hover:shadow-lg transition-all">
    {/* Account Settings card content */}
  </Card>
</Link>
```

---

## User Experience

1. **Loading State**: Show skeleton or spinner while fetching profile
2. **Success Feedback**: Toast notification on successful save
3. **Error Handling**: Toast notification with error message
4. **Optimistic Updates**: Update local state immediately for profile
5. **Back Navigation**: Link to return to dashboard
6. **Responsive Design**: Single column on mobile, consistent with existing pages

---

## Security Considerations

- Password change uses Supabase Auth API (server-validated)
- Profile updates protected by RLS policies (users can only update their own)
- Delete account confirmation requires explicit user action
- No sensitive data exposed in client state

---

## Technical Notes

### Profiles Table Schema (Existing)

| Column | Type | Updatable |
|--------|------|-----------|
| first_name | text | Yes |
| last_name | text | Yes |
| email | text | No (display only) |
| created_at | timestamp | No |
| plan | text | No (display only) |
| status | text | No |

### RLS Policies (Existing)
- Users can update their own profile via `auth.uid() = user_id`
- No additional database changes needed

