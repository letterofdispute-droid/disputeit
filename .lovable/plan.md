
# Fix Google Account Linking

## Root Cause Analysis

There are two separate issues:

### Issue 1: The `linkGoogle` flow is broken

The current `linkGoogle` function in `useAuth.tsx` calls `supabase.auth.linkIdentity()` which returns a `url` and redirects the user to Google. When Google returns the user to `/settings?...` or `/settings#access_token=...`, nothing in the app processes that OAuth callback. The `oauthTokenHandler` only looks for `__lovable_token` (the Lovable broker token) - it ignores Supabase's native `#access_token` hash fragments. So the user lands back on Settings but the identity is never actually linked.

### Issue 2: Email+Google account merging (automatic linking)

When a user registers with email/password and later tries to sign in with Google using the same email, Supabase returns an `identity_already_exists` error by default. This requires enabling "automatic account linking" at the auth provider level, plus handling the error gracefully in the UI.

---

## The Fix: 3 Files Changed

### 1. `src/hooks/useAuth.tsx` - Rewrite `linkGoogle`

The `linkGoogle` function needs to use `skipBrowserRedirect: true` to get the Google OAuth URL, then redirect manually. When the user returns to `/settings`, the URL will have a `#access_token=...` fragment. We need to detect and process this.

Updated `linkGoogle`:
```typescript
const linkGoogle = async () => {
  // Store flag so we know a link attempt is in progress when we return
  sessionStorage.setItem('linking_google', 'true');
  
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/settings`,
      skipBrowserRedirect: true,
    },
  });
  
  if (error) {
    sessionStorage.removeItem('linking_google');
    return { error };
  }
  
  if (data?.url) {
    window.location.href = data.url;
  }
  return { error: null };
};
```

### 2. `src/lib/oauthTokenHandler.ts` - Handle Supabase hash fragment return

After identity linking, Supabase redirects back with `#access_token=...&type=user` in the URL hash. Currently only `__lovable_token` is handled. Add detection for the Supabase hash fragment:

```typescript
// Also detect Supabase native OAuth return (hash fragment)
const hashParams = new URLSearchParams(window.location.hash.slice(1));
const accessToken = hashParams.get('access_token');
const tokenType = hashParams.get('type'); // 'user' for identity linking

if (accessToken && (tokenType === 'user' || tokenType === 'recovery')) {
  // Supabase will pick this up via onAuthStateChange
  // Just clean the URL hash and return processed=true
  window.history.replaceState({}, '', window.location.pathname + window.location.search);
  sessionStorage.setItem('oauth_just_processed', 'true');
  // Give Supabase a moment to fire onAuthStateChange
  await new Promise(resolve => setTimeout(resolve, 300));
  return { processed: true };
}
```

### 3. `src/components/settings/LinkedAccountsCard.tsx` - Handle post-link return and show success

Add a `useEffect` that detects when the user has just returned from Google linking (via `sessionStorage.getItem('linking_google')`) and shows a success or error toast. After the `onAuthStateChange` fires with `IDENTITY_LINKED` or `USER_UPDATED`, the `user` object in `useAuth` will update and `hasGoogle` will flip to `true` automatically.

```typescript
useEffect(() => {
  const wasLinking = sessionStorage.getItem('linking_google');
  if (!wasLinking) return;
  
  sessionStorage.removeItem('linking_google');
  
  // Check if Google is now linked (user object already updated via onAuthStateChange)
  const googleLinked = user?.identities?.some(i => i.provider === 'google');
  if (googleLinked) {
    toast({ title: 'Google account linked!', description: 'You can now sign in with Google.' });
  }
}, [user]); // runs when user object updates after return
```

### 4. Email+Google Account Merging

This is handled by Supabase's "automatic account linking" feature. When it's enabled in the auth config, if a user signs in via Google with an email that already exists as an email/password account, Supabase merges them automatically instead of throwing an error.

In `src/pages/LoginPage.tsx` and `src/pages/SignupPage.tsx`, the Google sign-in already uses `lovable.auth.signInWithOAuth("google")`. With automatic linking enabled, the merge happens server-side transparently. No code change needed for the merge itself.

However, we should improve the error message in `LoginPage.tsx` - if Google sign-in fails because of a conflict (which shouldn't happen with auto-linking but could in edge cases), show a clear message: "An account already exists with this email. Please sign in with your original method."

---

## Files to Modify

| File | Change |
|---|---|
| `src/hooks/useAuth.tsx` | Add `skipBrowserRedirect: true` to `linkIdentity`, set `linking_google` session flag |
| `src/lib/oauthTokenHandler.ts` | Add hash fragment detection for Supabase native OAuth return |
| `src/components/settings/LinkedAccountsCard.tsx` | Add `useEffect` to detect post-link return and show success toast |
| `src/pages/LoginPage.tsx` | Improve error message for account conflict edge case |

---

## Technical Notes

- **No backend changes needed.** The automatic account linking is a Supabase auth configuration setting. The Lovable Cloud platform manages this. The code fix is sufficient because `linkIdentity` already calls the right Supabase endpoint - the problem is purely in the redirect handling.
- **`skipBrowserRedirect: true`** is the key change - it prevents Supabase from doing an automatic redirect (which we can't intercept cleanly), and instead gives us the URL to redirect to ourselves, ensuring the return URL is `/settings`.
- **`onAuthStateChange` handles the session update** - when the user returns from Google and the hash fragment is present, Supabase's own client detects it and fires `IDENTITY_LINKED` → `USER_UPDATED` event, which updates the `user` object in `useAuth` with the new identity attached. We just need to ensure the URL is clean when this happens.
