import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getConsentSync } from '@/hooks/useCookieConsent';

const RECAPTCHA_SITE_KEY = '6Ld622AsAAAAAB0AAUWGc3Bl78A1YKxdM6Piu27-';

// Track if the script has been loaded
let scriptLoaded = false;
let scriptLoading = false;

const loadRecaptchaScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (scriptLoaded && window.grecaptcha?.enterprise) {
      resolve();
      return;
    }

    // Already loading, wait for it
    if (scriptLoading) {
      const checkLoaded = setInterval(() => {
        if (window.grecaptcha?.enterprise) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load reCAPTCHA script'));
    };

    document.head.appendChild(script);
  });
};

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only load reCAPTCHA if analytics consent has been granted
    const consent = getConsentSync();
    if (consent && !consent.analytics) {
      // User explicitly rejected analytics cookies – skip reCAPTCHA
      setIsReady(false);
      return;
    }

    loadRecaptchaScript()
      .then(() => {
        if (window.grecaptcha?.enterprise) {
          window.grecaptcha.enterprise.ready(() => {
            setIsReady(true);
          });
        }
      })
      .catch((error) => {
        console.warn('Failed to load reCAPTCHA:', error);
      });
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
