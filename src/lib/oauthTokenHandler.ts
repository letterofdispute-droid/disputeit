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
