
# Fix Google OAuth Login & Update Template Count

## Issue Analysis

### Issue 1: Google OAuth Login Broken

**Evidence from Console Logs:**
```
[OAuth] Processing token, payload keys: ["user_id", "project_id", "access_type", "iss", "sub", "aud", "exp", "nbf", "iat"]
[OAuth] No tokens in payload, checking existing session  
[OAuth] Could not establish session - no tokens and no existing session
```

**Root Cause:** The `__lovable_token` parameter returned by the OAuth broker contains **metadata only** (user_id, project_id, etc.), NOT the actual `access_token` and `refresh_token` needed to establish a Supabase session.

The Lovable OAuth broker handles two modes:
1. **Iframe mode (preview)**: Uses popup with `postMessage` to return tokens directly - this works
2. **Redirect mode (live site)**: Full page redirect - this is broken because the token exchange isn't completing

The backend authentication succeeds (auth logs show status 200), but the frontend doesn't receive the actual auth tokens.

**Solution:** The OAuth broker should be sending the tokens via a different mechanism. Since we can't modify the OAuth broker, we need to work with how Lovable Cloud auth is designed. The `__lovable_token` is likely a **one-time code** that should be exchanged for tokens via a specific endpoint, OR the broker should be setting cookies/localStorage that Supabase can use.

**Proposed Fix:** 
1. Remove the custom `oauthTokenHandler.ts` that's trying to decode tokens from `__lovable_token`
2. Instead, check if the Supabase session was set via cookies by the broker
3. Add a callback endpoint handler that exchanges the token with the broker

### Issue 2: Incorrect Template Count in Meta Description

**Location:** `index.html` - lines 16-17, 28, 38, 48

Currently shows "105+" templates when you have 500+ templates.

**Files to Update:**
- `index.html` - Update meta description, OG tags, Twitter cards, and JSON-LD schema

---

## Implementation Plan

### Part 1: Fix Google OAuth

Since the `__lovable_token` doesn't contain auth tokens, we need to investigate what the OAuth broker expects. There are two possibilities:

**Option A: Token Exchange Required**
The `__lovable_token` may be a one-time code that needs to be exchanged via an API call to the broker.

**Option B: Session via Cookies**
The OAuth broker may have already set the session via HTTP-only cookies, and we just need to call `getSession()` with proper timing.

Based on the library code (`cloud-auth-js`), when in redirect mode, it simply redirects to the broker. The broker should handle setting the session. Our custom `oauthTokenHandler.ts` is interfering with this process.

**Action Items:**

1. **Simplify the OAuth flow** - Remove the complex token decoding logic
2. **Let the broker set the session** - The Lovable OAuth infrastructure should handle this
3. **Add a delay and retry mechanism** - Give the broker time to establish the session
4. **Update `oauthTokenHandler.ts`**:
   - Just detect `__lovable_token` is present
   - Clean up the URL
   - Wait for session to be available (with retries)
   - Don't try to decode/extract tokens from the JWT

```typescript
// src/lib/oauthTokenHandler.ts - Simplified approach
export async function processOAuthToken(): Promise<{
  processed: boolean;
  error?: Error;
}> {
  const urlParams = new URLSearchParams(window.location.search);
  const lovableToken = urlParams.get('__lovable_token');
  
  if (!lovableToken) {
    return { processed: false };
  }

  try {
    // Clean up URL immediately
    cleanupUrl();
    
    // The OAuth broker should have set the session via cookies
    // Wait and retry to get the session
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('[OAuth] Session found after redirect');
        sessionStorage.setItem('oauth_just_processed', 'true');
        return { processed: true };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.warn('[OAuth] No session found after multiple attempts');
    return { processed: false };

  } catch (error) {
    console.error('[OAuth] Error processing redirect:', error);
    cleanupUrl();
    return { 
      processed: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
```

5. **Update `useAuth.tsx`**:
   - Increase delay after OAuth processing
   - Add retry logic for session fetch

### Part 2: Fix Template Count

Update `index.html` with correct template count (500+):

- Line 16: Title - "105+ Templates" -> "500+ Templates"
- Line 17: Meta description - "105+ legally-referenced" -> "500+ legally-referenced"
- Line 28: OG description - "105+ templates" -> "500+ templates"
- Line 38: Twitter description - "105+ legally-referenced" -> "500+ legally-referenced"
- Line 48: JSON-LD description - "105+ templates" -> "500+ templates"

---

## Technical Details

### Why the Current Approach Fails

The current `oauthTokenHandler.ts` assumes the JWT contains:
```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

But the actual payload contains:
```json
{
  "user_id": "...",
  "project_id": "...",
  "access_type": "...",
  "iss": "...",
  "sub": "...",
  "aud": "...",
  "exp": "...",
  "nbf": "...",
  "iat": "..."
}
```

This is a **reference token** (JWT claims about the auth event), not the actual Supabase auth tokens.

### The Correct Flow

When the Lovable OAuth broker redirects back with `__lovable_token`:
1. The broker has already completed authentication
2. The broker should have set the Supabase session (either via cookies or the token is meant for something else)
3. We should NOT try to decode the JWT to extract tokens
4. We should simply check if a session exists and redirect to dashboard

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/oauthTokenHandler.ts` | Simplify - remove token decoding, just check for session |
| `src/hooks/useAuth.tsx` | Add retry logic for session fetch |
| `index.html` | Update template count from 105+ to 500+ |

---

## Alternative Investigation

If the simplified approach doesn't work, we may need to:
1. Check if there's a `/~oauth/callback` endpoint that processes the token
2. Investigate if the token needs to be sent to an API endpoint for exchange
3. Check Lovable Cloud documentation for the expected redirect flow

The user mentioned this worked yesterday, which suggests either:
- A recent change in the OAuth broker behavior
- Our recent code changes broke something that was working
- A configuration issue on the Lovable Cloud side
