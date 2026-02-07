

# Plan: Fix Sign-Out Not Immediately Reflecting in UI

## Problem
When you click "Sign Out", the UI doesn't update immediately to show you're logged out. You have to refresh the page to see the change.

## Root Cause
The current sign-out function in `useAuth.tsx` only calls `supabase.auth.signOut()` and relies on the `onAuthStateChange` listener to update the state. However, this listener can have slight delays due to how authentication state propagates, causing the UI to appear "stuck" showing the logged-in state.

## Solution
Immediately clear the local authentication state after sign-out completes, rather than waiting for the `onAuthStateChange` event. This ensures the UI updates instantly.

---

## Changes Required

### 1. Update `src/hooks/useAuth.tsx`

**Current code:**
```typescript
const signOut = async () => {
  await supabase.auth.signOut();
};
```

**Updated code:**
```typescript
const signOut = async () => {
  await supabase.auth.signOut();
  // Immediately clear state for instant UI update
  setUser(null);
  setSession(null);
  setIsAdmin(false);
};
```

This change:
- Calls the Supabase sign-out method (clears tokens from storage)
- Immediately sets `user`, `session`, and `isAdmin` to their logged-out values
- Ensures the UI updates instantly without waiting for the event listener

---

## Technical Notes

- The `onAuthStateChange` listener will still fire and set the same null values, which is harmless
- This pattern is recommended by the Supabase documentation for instant UI feedback
- No changes needed to the Header component - it already correctly reads from the auth context

