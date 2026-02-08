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

    // The token payload is in the second part
    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    // Check if session already exists
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Session already exists, just clean up URL
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
