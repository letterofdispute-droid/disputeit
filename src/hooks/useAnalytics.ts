import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type EventType = 
  | 'page_view' 
  | 'letter_generated' 
  | 'user_signup' 
  | 'template_view' 
  | 'button_click'
  | 'form_started'
  | 'form_completed'
  | 'checkout_initiated'
  | 'checkout_completed'
  | 'credit_redeemed'
  | 'category_view';

interface TrackEventParams {
  eventType: EventType;
  eventData?: Record<string, any>;
}

// Generate or retrieve a session ID for anonymous tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async ({ eventType, eventData = {} }: TrackEventParams) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: {
          ...eventData,
          user_agent: navigator.userAgent,
          locale: navigator.language,
          screen_width: window.innerWidth,
        },
        user_id: user?.id || null,
        session_id: getSessionId(),
        page_path: window.location.pathname,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error('Analytics error:', error);
    }
  }, [user?.id]);

  const trackPageView = useCallback((pageName?: string) => {
    trackEvent({
      eventType: 'page_view',
      eventData: { 
        page: pageName || window.location.pathname,
        referrer: document.referrer,
      },
    });
  }, [trackEvent]);

  const trackLetterGenerated = useCallback((templateSlug: string, category: string) => {
    trackEvent({
      eventType: 'letter_generated',
      eventData: { templateSlug, category },
    });
  }, [trackEvent]);

  const trackTemplateView = useCallback((templateSlug: string, category: string) => {
    trackEvent({
      eventType: 'template_view',
      eventData: { templateSlug, category },
    });
  }, [trackEvent]);

  const trackUserSignup = useCallback(() => {
    trackEvent({
      eventType: 'user_signup',
      eventData: {},
    });
  }, [trackEvent]);

  const trackFormStarted = useCallback((templateSlug: string) => {
    trackEvent({
      eventType: 'form_started',
      eventData: { templateSlug },
    });
  }, [trackEvent]);

  const trackFormCompleted = useCallback((templateSlug: string) => {
    trackEvent({
      eventType: 'form_completed',
      eventData: { templateSlug },
    });
  }, [trackEvent]);

  const trackCheckoutInitiated = useCallback((templateSlug: string, purchaseType: string, amount: number) => {
    trackEvent({
      eventType: 'checkout_initiated',
      eventData: { templateSlug, purchaseType, amount },
    });
  }, [trackEvent]);

  const trackCheckoutCompleted = useCallback((templateSlug: string, purchaseType: string, amount: number) => {
    trackEvent({
      eventType: 'checkout_completed',
      eventData: { templateSlug, purchaseType, amount },
    });
  }, [trackEvent]);

  const trackCreditRedeemed = useCallback((templateSlug: string) => {
    trackEvent({
      eventType: 'credit_redeemed',
      eventData: { templateSlug },
    });
  }, [trackEvent]);

  const trackCategoryView = useCallback((categoryId: string) => {
    trackEvent({
      eventType: 'category_view',
      eventData: { categoryId },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackLetterGenerated,
    trackTemplateView,
    trackUserSignup,
    trackFormStarted,
    trackFormCompleted,
    trackCheckoutInitiated,
    trackCheckoutCompleted,
    trackCreditRedeemed,
    trackCategoryView,
  };
};

// Hook for automatic page view tracking
export const usePageView = (pageName?: string) => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
};
