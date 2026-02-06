import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const RECAPTCHA_SITE_KEY = '6Ld622AsAAAAAB0AAUWGc3Bl78A1YKxdM6Piu27-';

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if grecaptcha.enterprise is available
    const checkReady = () => {
      if (window.grecaptcha?.enterprise) {
        window.grecaptcha.enterprise.ready(() => {
          setIsReady(true);
        });
      } else {
        // Retry after a short delay if not yet loaded
        setTimeout(checkReady, 100);
      }
    };
    
    checkReady();
  }, []);

  const verifyRecaptcha = useCallback(async (action: string): Promise<{ success: boolean; score?: number; error?: string }> => {
    // If reCAPTCHA Enterprise is not ready, skip verification (graceful degradation)
    if (!window.grecaptcha?.enterprise) {
      console.warn('reCAPTCHA Enterprise not ready, skipping verification');
      return { success: true };
    }

    try {
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.enterprise.ready(async () => {
          try {
            const token = await window.grecaptcha.enterprise.execute(
              RECAPTCHA_SITE_KEY,
              { action }
            );
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, action }
      });

      if (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (err) {
      console.error('reCAPTCHA error:', err);
      return { success: false, error: 'Verification failed' };
    }
  }, []);

  return { verifyRecaptcha, isReady };
};
