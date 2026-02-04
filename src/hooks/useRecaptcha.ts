import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export const useRecaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const verifyRecaptcha = useCallback(async (action: string): Promise<{ success: boolean; score?: number; error?: string }> => {
    // If reCAPTCHA is not configured (no site key), skip verification
    if (!RECAPTCHA_SITE_KEY) {
      console.info('reCAPTCHA not configured, skipping verification');
      return { success: true };
    }

    // If provider not ready yet, skip verification (graceful degradation)
    if (!executeRecaptcha) {
      console.warn('reCAPTCHA not ready, skipping verification');
      return { success: true };
    }

    try {
      const token = await executeRecaptcha(action);
      
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
  }, [executeRecaptcha]);

  return { verifyRecaptcha, isReady: !!executeRecaptcha };
};
