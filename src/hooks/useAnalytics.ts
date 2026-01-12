import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type EventType = 'page_view' | 'letter_generated' | 'user_signup' | 'template_view' | 'button_click';

interface TrackEventParams {
  eventType: EventType;
  eventData?: Record<string, any>;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async ({ eventType, eventData = {} }: TrackEventParams) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: eventData,
        user_id: user?.id || null,
        page_url: window.location.pathname,
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

  return {
    trackEvent,
    trackPageView,
    trackLetterGenerated,
    trackTemplateView,
    trackUserSignup,
  };
};

// Hook for automatic page view tracking
export const usePageView = (pageName?: string) => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
};
