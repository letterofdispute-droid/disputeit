

# Fix Google OAuth on Custom Domain (letterofdispute.com)

## Problem Identified

The Lovable OAuth broker (`/~oauth/initiate`) is designed for Lovable's preview environment. On custom domains like `letterofdispute.com`, the broker returns a `__lovable_token` that contains only metadata (user_id, project_id), NOT the actual Supabase access_token and refresh_token needed to establish a session.

**Why it worked before:** The broker may have been updated, or previous code was using a different flow.

**Root Cause:** The Lovable Cloud auth library (`@lovable.dev/cloud-auth-js`) only fully handles the popup/iframe flow. For the redirect flow (used on live sites), it just redirects and returns `{ redirected: true }` without any callback handling.

---

## Solution

Bypass the Lovable OAuth broker on custom domains and use Supabase's native OAuth directly with `skipBrowserRedirect: true`. This gives us the OAuth URL directly, which we can then use to redirect the user. When they return, the tokens will be in the URL hash fragment which Supabase can process automatically.

---

## Implementation Plan

### File 1: src/pages/LoginPage.tsx

Update `handleGoogleSignIn` to detect custom domain and bypass the broker:

```typescript
import { supabase } from '@/integrations/supabase/client';

const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  trackGoogleAuthClick('login');
  
  // Detect if we're on a custom domain (not Lovable preview)
  const isCustomDomain = !window.location.hostname.includes('lovable.app') &&
                         !window.location.hostname.includes('lovableproject.com');
  
  if (isCustomDomain) {
    // Bypass Lovable OAuth broker - use Supabase directly
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
    
    // Redirect to OAuth URL
    if (data?.url) {
      window.location.href = data.url;
    }
    return;
  }
  
  // For Lovable preview domains, use the managed OAuth
  sessionStorage.setItem('oauth_pending', 'true');
  
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });

  if (error) {
    sessionStorage.removeItem('oauth_pending');
    toast({
      title: 'Error signing in with Google',
      description: error.message,
      variant: 'destructive',
    });
    setIsGoogleLoading(false);
  }
};
```

### File 2: src/pages/SignupPage.tsx

Apply the same fix:

```typescript
import { supabase } from '@/integrations/supabase/client';

const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  trackGoogleAuthClick('signup');
  
  // Detect if we're on a custom domain (not Lovable preview)
  const isCustomDomain = !window.location.hostname.includes('lovable.app') &&
                         !window.location.hostname.includes('lovableproject.com');
  
  if (isCustomDomain) {
    // Bypass Lovable OAuth broker - use Supabase directly
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
    
    // Redirect to OAuth URL
    if (data?.url) {
      window.location.href = data.url;
    }
    return;
  }
  
  // For Lovable preview domains, use the managed OAuth
  sessionStorage.setItem('oauth_pending', 'true');
  
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });

  if (error) {
    sessionStorage.removeItem('oauth_pending');
    toast({
      title: 'Error signing in with Google',
      description: error.message,
      variant: 'destructive',
    });
    setIsGoogleLoading(false);
  }
};
```

### File 3: src/lib/oauthTokenHandler.ts

This file can be simplified since the native Supabase OAuth handles token exchange automatically via URL hash fragments. The `__lovable_token` handling is only needed for the Lovable preview environment.

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function processOAuthToken(): Promise<{
  processed: boolean;
  error?: Error;
}> {
  // Check for Lovable broker token (preview environment only)
  const urlParams = new URLSearchParams(window.location.search);
  const lovableToken = urlParams.get('__lovable_token');
  
  if (!lovableToken) {
    return { processed: false };
  }

  console.log('[OAuth] Token detected in URL, processing redirect...');

  try {
    // Clean up URL immediately to prevent reprocessing
    cleanupUrl();
    
    // The OAuth broker should have set the session via cookies/storage
    // Wait and retry to get the session with increasing delays
    const delays = [100, 200, 300, 500, 800];
    
    for (let attempt = 0; attempt < delays.length; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[OAuth] Error getting session:', error);
        continue;
      }
      
      if (session) {
        console.log('[OAuth] Session found after redirect, attempt:', attempt + 1);
        sessionStorage.setItem('oauth_just_processed', 'true');
        return { processed: true };
      }
      
      console.log('[OAuth] No session yet, attempt:', attempt + 1);
    }

    console.warn('[OAuth] No session found after multiple attempts');
    return { processed: false };

  } catch (error) {
    console.error('[OAuth] Error processing redirect:', error);
    return { 
      processed: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

function cleanupUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('__lovable_token');
  window.history.replaceState({}, '', url.toString());
}
```

---

## How This Works

### On Custom Domain (letterofdispute.com):
1. User clicks "Sign in with Google"
2. Code detects custom domain and calls `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true`
3. Supabase returns the OAuth URL directly (accounts.google.com)
4. We manually redirect to that URL
5. After authentication, Google redirects to `https://letterofdispute.com/dashboard` (via Supabase callback)
6. Supabase's client library automatically picks up the tokens from the URL hash
7. Session is established, user is logged in

### On Lovable Preview (disputeit.lovable.app):
1. User clicks "Sign in with Google"
2. Code uses the managed `lovable.auth.signInWithOAuth`
3. Popup/iframe flow handles authentication
4. Tokens returned via postMessage
5. Session is set via `supabase.auth.setSession`

---

## Google Cloud Console Requirements

Ensure the following redirect URI is configured:

**Authorized redirect URIs:**
- `https://koulmtfnkuapzigcplov.supabase.co/auth/v1/callback`

This is the Supabase callback URL that handles the OAuth code exchange. The Supabase project ID is `koulmtfnkuapzigcplov`.

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/LoginPage.tsx` | Update | Bypass OAuth broker on custom domains |
| `src/pages/SignupPage.tsx` | Update | Bypass OAuth broker on custom domains |
| `src/lib/oauthTokenHandler.ts` | Keep | Still needed for Lovable preview environment |

---

## Technical Notes

1. **Why `skipBrowserRedirect: true`**: This gives us the OAuth URL directly instead of letting Supabase redirect automatically. We need this to control the flow.

2. **Why `redirectTo: /dashboard`**: After successful OAuth, users land directly on the dashboard.

3. **Supabase URL hash handling**: The Supabase JS client automatically detects tokens in URL hash fragments (`#access_token=...`) and establishes the session.

4. **Dual flow support**: The code supports both custom domains (direct Supabase OAuth) and Lovable preview (managed OAuth broker).

