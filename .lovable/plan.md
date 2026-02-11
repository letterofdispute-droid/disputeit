

# Account Linking: Merge Email + Google Accounts

## The Problem

When a user signs up with email/password and later tries to log in with Google using the same email address, one of two things currently happens:
- A new, separate account is created (losing access to their existing letters and purchases)
- An error occurs with no helpful guidance

Neither outcome is good for users.

## The Solution

We'll implement **automatic account linking** on the backend, plus a clear UI flow for edge cases.

### How It Works

1. **Backend: Enable automatic identity linking** -- Configure the authentication system to automatically merge identities when the same email is used across providers. This means if a user signed up with email and later logs in with Google (same email), both sign-in methods will be linked to the **same account**.

2. **Frontend: Handle the "email already exists" error gracefully** -- If automatic linking isn't possible (e.g., email isn't confirmed yet), show a helpful message guiding the user to sign in with their original method first.

3. **Frontend: Add identity linking from the Settings page** -- Allow logged-in users to manually connect their Google account from their account settings, so they can use either method going forward.

## Implementation Steps

### Step 1: Enable Automatic Identity Linking (Backend)
- Use the authentication settings tool to enable the "allow linking identities with the same email" option
- This is a one-time configuration change -- no migration needed

### Step 2: Improve Error Handling on Login/Signup Pages
- Catch the specific error that occurs when an email conflict is detected
- Show a user-friendly toast: *"An account with this email already exists. Please sign in with your original method (email/password or Google), then link additional sign-in methods from Settings."*
- Apply this to both `LoginPage.tsx` and `SignupPage.tsx`

### Step 3: Add "Linked Accounts" Section to Settings Page
- Add a new card to `SettingsPage.tsx` showing which sign-in methods are connected
- Display the user's current identities (email, Google, etc.)
- Add a "Connect Google Account" button if Google isn't linked yet
- Add ability to unlink a provider (only if another method exists)

### Step 4: Profile Data Reconciliation
- When accounts are merged, ensure the `profiles` table isn't affected (the `handle_new_user` trigger only fires on new user creation, not identity linking)
- Update the profile's `avatar_url` from Google if the user doesn't already have one

## Technical Details

### Files to Modify
- `src/pages/LoginPage.tsx` -- Better error messages for email conflicts
- `src/pages/SignupPage.tsx` -- Better error messages for email conflicts
- `src/pages/SettingsPage.tsx` -- Add linked accounts management UI
- `src/hooks/useAuth.tsx` -- Add `linkIdentity` and `unlinkIdentity` methods

### New Components
- `src/components/settings/LinkedAccountsCard.tsx` -- UI for managing connected sign-in methods

### Auth Configuration
- Enable automatic identity linking in the authentication settings

### Edge Cases Handled
- User with unconfirmed email tries Google login -- shown guidance to confirm email first
- User tries to unlink their only sign-in method -- prevented with validation
- Google provides updated name/avatar -- profile updated if fields are currently empty
