import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getConsentSync } from '@/hooks/useCookieConsent';

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
  | 'category_view'
  | 'site_search'
  | 'search_click'
  | 'search_exit';

interface TrackEventParams {
  eventType: EventType;
  eventData?: Record<string, any>;
}

interface Attribution {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  channel: string;
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

// Classify a referrer + UTM combo into a channel
const classifyChannel = (source: string | null, medium: string | null, referrer: string): string => {
  // UTM-based classification
  if (source) {
    if (medium === 'cpc' || medium === 'ppc' || medium === 'paid') return 'Paid Search';
    if (medium === 'email') return 'Email';
    if (medium === 'social') return 'Social';
    return 'Referral';
  }

  // Referrer-based classification
  if (referrer) {
    try {
      const hostname = new URL(referrer).hostname.toLowerCase();
      if (/google|bing|yahoo|duckduckgo|baidu|yandex/.test(hostname)) return 'Organic Search';
      if (/facebook|twitter|instagram|linkedin|reddit|tiktok|pinterest|x\.com|threads/.test(hostname)) return 'Social';
      // If referrer is our own domain, treat as direct
      if (hostname === window.location.hostname) return 'Direct';
      return 'Referral';
    } catch {
      return 'Direct';
    }
  }

  return 'Direct';
};

// Get current UTM params from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
  };
};

// Compute attribution from current context
const computeAttribution = (referrer: string): Attribution => {
  const utms = getUTMParams();
  const channel = classifyChannel(utms.source, utms.medium, referrer);
  return {
    source: utms.source || (referrer ? new URL(referrer).hostname : null),
    medium: utms.medium || null,
    campaign: utms.campaign || null,
    channel,
  };
};

// Get or set first-touch attribution (persisted in localStorage, never changes)
const getFirstTouch = (): Attribution => {
  const stored = localStorage.getItem('first_touch_attribution');
  if (stored) {
    try { return JSON.parse(stored); } catch { /* fall through */ }
  }
  const attribution = computeAttribution(document.referrer);
  localStorage.setItem('first_touch_attribution', JSON.stringify(attribution));
  return attribution;
};

// Get last-touch attribution (computed fresh each time)
const getLastTouch = (): Attribution => {
  return computeAttribution(document.referrer);
};

// Track the previous page path within the session
let prevPagePath: string | null = null;

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async ({ eventType, eventData = {} }: TrackEventParams) => {
    try {
      // Respect cookie consent – skip if analytics not granted
      const consent = getConsentSync();
      if (consent && !consent.analytics) return;

      const firstTouch = getFirstTouch();
      const lastTouch = getLastTouch();

      await supabase.from('analytics_events').insert([{
        event_type: eventType,
        event_data: {
          ...eventData,
          user_agent: navigator.userAgent,
          locale: navigator.language,
          screen_width: window.innerWidth,
          referrer: document.referrer || null,
          first_touch: firstTouch as any,
          last_touch: lastTouch as any,
          prev_page: prevPagePath,
        } as any,
        user_id: user?.id || null,
        session_id: getSessionId(),
        page_path: window.location.pathname,
      }]);
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error('Analytics error:', error);
    }
  }, [user?.id]);

  const trackPageView = useCallback((pageName?: string) => {
    const currentPath = window.location.pathname;
    trackEvent({
      eventType: 'page_view',
      eventData: { 
        page: pageName || currentPath,
        referrer: document.referrer,
      },
    });
    // Update prev_page after tracking so next event has the breadcrumb
    prevPagePath = currentPath;
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
