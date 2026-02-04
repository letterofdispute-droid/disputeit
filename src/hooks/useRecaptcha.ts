import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRecaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const verifyRecaptcha = useCallback(async (action: string): Promise<{ success: boolean; score?: number; error?: string }> => {
    if (!executeRecaptcha) {
      console.warn('reCAPTCHA not ready');
      return { success: false, error: 'reCAPTCHA not ready' };
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
