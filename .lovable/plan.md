
# Plan: Fix Google OAuth Login on Custom Domain (letterofdispute.com)

## Problem
When logging in with Google on your custom domain (letterofdispute.com), after selecting a Google account, you're redirected to the homepage instead of being logged in. This happens because:

1. The Lovable auth-bridge is designed for `*.lovable.app` domains
2. On custom domains, the auth-bridge incorrectly handles the OAuth callback
3. The session tokens aren't properly set after the redirect

## Solution
Detect when the app is running on your custom domain and bypass the auth-bridge by using the Supabase client directly with `skipBrowserRedirect: true`. This gives us the OAuth URL directly so we can handle the redirect manually.

---

## Changes Required

### 1. Update `src/pages/LoginPage.tsx`

Replace the `handleGoogleSignIn` function with custom domain detection logic:

```typescript
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  trackGoogleAuthClick('login');
  
  // Detect if we're on a custom domain
  const isCustomDomain = 
    !window.location.hostname.includes('lovable.app') &&
    !window.location.hostname.includes('lovableproject.com');
  
  if (isCustomDomain) {
    // Bypass auth-bridge by using Supabase directly
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        skipBrowserRedirect: true,
      },
    });
    
    if (error) {
      toast({
        title: 'Error signing in with Google',
        description: error.message,
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
      return;
    }
    
    // Validate and redirect to OAuth URL
    if (data?.url) {
      window.location.href = data.url;
    }
  } else {
    // For Lovable domains, use the managed auth
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    
    if (error) {
      toast({
        title: 'Error signing in with Google',
        description: error.message,
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
  }
};
```

### 2. Update `src/pages/SignupPage.tsx`

Apply the same fix to the signup page's `handleGoogleSignIn` function.

### 3. Add Supabase Import

Add the Supabase client import to both files:
```typescript
import { supabase } from '@/integrations/supabase/client';
```

---

## How This Works

```text
+------------------+     +-----------------+     +------------------+
|  User clicks     |     | Custom domain?  |     | Use Supabase     |
|  "Continue with  | --> | letterofdispute | --> | directly with    |
|  Google"         |     | .com detected   |     | skipBrowserRedirect
+------------------+     +-----------------+     +------------------+
                                |                        |
                                | No (lovable.app)       |
                                v                        v
                         +-----------------+     +------------------+
                         | Use Lovable     |     | Manual redirect  |
                         | auth-bridge     |     | to Google OAuth  |
                         | (existing flow) |     | then /dashboard  |
                         +-----------------+     +------------------+
```

---

## Files to Modify

1. **src/pages/LoginPage.tsx** - Add custom domain detection and Supabase OAuth fallback
2. **src/pages/SignupPage.tsx** - Same changes for the signup flow

---

## Backend Configuration Required

Ensure your custom domain is configured in your backend Authentication Settings:
- **Site URL**: `https://letterofdispute.com`
- **Redirect URLs**: Add `https://letterofdispute.com/**`

This can be verified in the Lovable Cloud dashboard under Users > Authentication Settings.
