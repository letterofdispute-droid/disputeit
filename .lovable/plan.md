
# Fix Google OAuth Login (Token Processing Issue)

## Problem Analysis

Google OAuth authentication completes successfully on the backend (confirmed via auth logs showing status 200 for `/token` endpoint), but users are not logged in after being redirected back to the homepage.

**Root Cause Identified**: When the OAuth broker redirects back with `__lovable_token`, our token processing has several issues:

1. **Race Condition**: The `getSession()` call in `oauthTokenHandler.ts` runs BEFORE the token can be properly set, causing it to find no session
2. **Token Structure**: The JWT payload from the OAuth broker may have a different structure than expected
3. **Missing Await**: The `processOAuthToken()` may not be properly awaiting the session to be established before `getSession()` is called in `useAuth.tsx`

## Solution

Fix the OAuth token handler to properly:
1. Decode the `__lovable_token` JWT correctly
2. Call `setSession()` FIRST (don't check for existing session beforehand)
3. Ensure proper error handling and logging
4. Add debug logging to help diagnose issues

---

## Implementation Details

### File 1: src/lib/oauthTokenHandler.ts

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function processOAuthToken(): Promise<{
  processed: boolean;
  error?: Error;
}> {
  // Check for the __lovable_token parameter
  const urlParams = new URLSearchParams(window.location.search);
  const lovableToken = urlParams.get('__lovable_token');
  
  if (!lovableToken) {
    return { processed: false };
  }

  try {
    // Decode the JWT payload (base64url decode the middle part)
    const parts = lovableToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // The token payload is in the second part - handle base64url properly
    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const paddedPayload = payloadBase64.padEnd(
      payloadBase64.length + (4 - payloadBase64.length % 4) % 4, 
      '='
    );
    
    const payloadJson = atob(paddedPayload);
    const payload = JSON.parse(payloadJson);

    console.log('[OAuth] Processing token, payload keys:', Object.keys(payload));

    // The payload might have tokens at different paths
    // Try direct access first, then nested access
    const accessToken = payload.access_token || payload.tokens?.access_token;
    const refreshToken = payload.refresh_token || payload.tokens?.refresh_token;

    if (accessToken && refreshToken) {
      console.log('[OAuth] Setting session with tokens');
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (error) {
        console.error('[OAuth] Failed to set session:', error);
        cleanupUrl();
        return { processed: false, error };
      }
      
      console.log('[OAuth] Session set successfully');
      cleanupUrl();
      return { processed: true };
    }

    // If no tokens in payload, try to get session (maybe broker set it via cookies)
    console.log('[OAuth] No tokens in payload, checking existing session');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('[OAuth] Found existing session');
      cleanupUrl();
      return { processed: true };
    }

    // Clean up URL even if we couldn't process
    console.warn('[OAuth] Could not establish session - no tokens and no existing session');
    cleanupUrl();
    return { processed: false };

  } catch (error) {
    console.error('[OAuth] Failed to process OAuth token:', error);
    cleanupUrl();
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

### File 2: src/hooks/useAuth.tsx

Add a small delay after OAuth processing to allow the session to propagate:

```typescript
const initializeAuth = async () => {
  try {
    // STEP 1: Process OAuth token if present in URL
    const oauthResult = await processOAuthToken();
    
    // If OAuth was processed, give a moment for session to propagate
    if (oauthResult.processed) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // STEP 2: Get the session (may have been set by OAuth processing)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!isMounted) return;

    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  } finally {
    if (isMounted) {
      setIsLoading(false);
    }
  }
};
```

### File 3: src/components/auth/AuthRedirectHandler.tsx

Also detect OAuth return via URL token (in case sessionStorage flag is lost):

```typescript
useEffect(() => {
  if (isLoading || hasRedirected.current) return;

  // Check if we just came back from OAuth (flag set before redirect OR token was in URL)
  const oauthPending = sessionStorage.getItem('oauth_pending');
  const justProcessedOAuth = sessionStorage.getItem('oauth_just_processed');
  
  // If user is logged in and on home page after OAuth
  if (user && location.pathname === '/' && (oauthPending || justProcessedOAuth)) {
    hasRedirected.current = true;
    sessionStorage.removeItem('oauth_pending');
    sessionStorage.removeItem('oauth_just_processed');
    navigate('/dashboard', { replace: true });
  }
}, [user, isLoading, location.pathname, navigate]);
```

Then update oauthTokenHandler.ts to set this flag:
```typescript
// After successfully setting session
sessionStorage.setItem('oauth_just_processed', 'true');
cleanupUrl();
return { processed: true };
```

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/oauthTokenHandler.ts` | Update | Fix base64 padding, add nested token access, add debug logging, set redirect flag |
| `src/hooks/useAuth.tsx` | Update | Add small delay after OAuth processing for session propagation |
| `src/components/auth/AuthRedirectHandler.tsx` | Update | Detect OAuth completion via secondary flag |

---

## Technical Notes

1. **Base64 Padding**: JWT base64url encoding often omits padding, which can cause `atob()` to fail. Added proper padding calculation.

2. **Token Structure**: The OAuth broker may nest tokens differently. Checking both `payload.access_token` and `payload.tokens?.access_token`.

3. **Debug Logging**: Added console logs to help diagnose issues in production without needing to reproduce locally.

4. **Redundant Flag**: Using both `oauth_pending` and `oauth_just_processed` ensures the redirect happens even if the first flag is cleared prematurely.

5. **Session Propagation Delay**: Small 100ms delay allows Supabase's internal state to update before we query `getSession()`.
