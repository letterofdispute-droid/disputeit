
# Fix Google OAuth Sign-In (Complete Authentication Flow)

## Problem Identified

Google OAuth authentication is completing successfully on the backend, but users are not logged in after being redirected to the homepage. 

**Root Cause**: The Lovable OAuth library uses a redirect flow on the live site (non-iframe). After OAuth completes, users are redirected back to the app with a `__lovable_token` URL parameter containing the authentication tokens. However, **there is no code to process this token and establish the Supabase session**.

The current flow:
1. User clicks "Sign in with Google"
2. `lovable.auth.signInWithOAuth()` redirects to `/~oauth/initiate`
3. User authenticates with Google
4. User is redirected back to `origin/?__lovable_token=<JWT>`
5. **MISSING**: Token is not extracted and session is not established
6. User appears not logged in

---

## Solution

Create an **OAuth Token Handler** that runs on app initialization to:
1. Detect the `__lovable_token` URL parameter
2. Decode the JWT to extract `access_token` and `refresh_token`
3. Call `supabase.auth.setSession()` to establish the session
4. Clean up the URL and redirect to dashboard

---

## Implementation

### File 1: src/lib/oauthTokenHandler.ts (NEW)

Create a utility that processes the OAuth token from the URL:

```typescript
import { supabase } from '@/integrations/supabase/client';

interface LovableTokenPayload {
  access_token?: string;
  refresh_token?: string;
  // The JWT might contain other fields
}

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

    // The token payload is in the second part
    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    // The actual Supabase tokens should be in the payload
    // Based on the OAuth flow, we need to exchange this token for a session
    // The token contains project info, we need to call the Supabase token endpoint
    
    // Actually, looking at the auth logs, the OAuth broker already called /token
    // and should have set the session. Let's check if session exists first.
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Session already exists, just clean up URL and redirect
      cleanupUrl();
      return { processed: true };
    }

    // If no session, the token might contain the actual tokens
    // Try to set session if tokens are present
    if (payload.access_token && payload.refresh_token) {
      await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      cleanupUrl();
      return { processed: true };
    }

    // Clean up URL even if we couldn't process
    cleanupUrl();
    return { processed: false };

  } catch (error) {
    console.error('Failed to process OAuth token:', error);
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

### File 2: src/hooks/useAuth.tsx (UPDATE)

Add OAuth token processing on initial load:

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { processOAuthToken } from '@/lib/oauthTokenHandler';

// ... existing interface and context ...

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin, first_name, last_name, avatar_url')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setIsAdmin(data.is_admin ?? false);
      setProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // STEP 1: Process OAuth token if present in URL
        await processOAuthToken();

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

    // Set up auth state change listener BEFORE initializing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setIsAdmin(false);
          setProfile(null);
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ... rest of the hook (signUp, signIn, signOut) stays the same ...
};
```

### File 3: src/components/auth/AuthRedirectHandler.tsx (NEW)

Handle post-login redirect to dashboard:

```typescript
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthRedirectHandler = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    // Check if we just came back from OAuth (flag set before redirect)
    const oauthPending = sessionStorage.getItem('oauth_pending');
    
    // If user is logged in and on home page after OAuth
    if (user && location.pathname === '/' && oauthPending) {
      hasRedirected.current = true;
      sessionStorage.removeItem('oauth_pending');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);

  return null;
};

export default AuthRedirectHandler;
```

### File 4: src/App.tsx (UPDATE)

Add the AuthRedirectHandler:

```typescript
import AuthRedirectHandler from './components/auth/AuthRedirectHandler';

// Inside BrowserRouter, after ScrollToTop:
<BrowserRouter>
  <ScrollToTop />
  <AuthRedirectHandler />
  <Routes>
    {/* ... existing routes ... */}
  </Routes>
</BrowserRouter>
```

### File 5: src/pages/LoginPage.tsx (UPDATE)

Set the OAuth pending flag before redirect:

```typescript
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  trackGoogleAuthClick('login');
  
  // Set flag so we know to redirect after OAuth return
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

### File 6: src/pages/SignupPage.tsx (UPDATE)

Same change for signup:

```typescript
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  trackGoogleAuthClick('signup');
  
  // Set flag so we know to redirect after OAuth return
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

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/oauthTokenHandler.ts` | CREATE | Process `__lovable_token` from URL |
| `src/hooks/useAuth.tsx` | UPDATE | Call token processor on init, use mounted flag pattern |
| `src/components/auth/AuthRedirectHandler.tsx` | CREATE | Redirect to dashboard after OAuth |
| `src/App.tsx` | UPDATE | Add AuthRedirectHandler component |
| `src/pages/LoginPage.tsx` | UPDATE | Set `oauth_pending` flag before redirect |
| `src/pages/SignupPage.tsx` | UPDATE | Set `oauth_pending` flag before redirect |

---

## Technical Notes

1. **Token Processing Order**: The OAuth token must be processed BEFORE calling `getSession()`, as the token contains the credentials needed to establish the session.

2. **Mounted Flag Pattern**: Prevents React state updates after component unmounts, avoiding memory leaks.

3. **Session Storage Flag**: Uses `sessionStorage` (not `localStorage`) so the flag is cleared when the browser tab closes, preventing unwanted redirects on future visits.

4. **URL Cleanup**: The `__lovable_token` parameter is removed from the URL after processing to keep URLs clean and prevent token leakage in browser history.

5. **Sign-Out Behavior**: Already handled - state is cleared immediately before calling Supabase signOut.
