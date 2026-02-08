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
      sessionStorage.setItem('oauth_just_processed', 'true');
      cleanupUrl();
      return { processed: true };
    }

    // If no tokens in payload, try to get session (maybe broker set it via cookies)
    console.log('[OAuth] No tokens in payload, checking existing session');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('[OAuth] Found existing session');
      sessionStorage.setItem('oauth_just_processed', 'true');
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
