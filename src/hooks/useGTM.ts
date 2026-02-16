// Google Tag Manager tracking hook
// Centralized event tracking for funnel analytics

import { getConsentSync } from '@/hooks/useCookieConsent';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export type FunnelStage = 
  | 'awareness'      // Homepage, category views
  | 'interest'       // Template views, AI assistant opened
  | 'consideration'  // Form started, form steps
  | 'conversion'     // Purchase initiated, purchase complete
  | 'retention';     // Login, dashboard access

export interface GTMEvent {
  event: string;
  funnel_stage: FunnelStage;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  [key: string]: unknown;
}

const pushToDataLayer = (eventData: GTMEvent) => {
  if (typeof window === 'undefined') return;

  // Respect cookie consent – don't push events if analytics not granted
  const consent = getConsentSync();
  if (consent && !consent.analytics) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ...eventData,
    page_path: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
};

// ============ AWARENESS STAGE ============

export const trackPageView = (pageName: string) => {
  pushToDataLayer({
    event: 'page_view',
    funnel_stage: 'awareness',
    event_category: 'navigation',
    event_action: 'view',
    event_label: pageName,
  });
};

export const trackHomepageView = () => {
  pushToDataLayer({
    event: 'homepage_view',
    funnel_stage: 'awareness',
    event_category: 'engagement',
    event_action: 'view',
    event_label: 'homepage',
  });
};

export const trackCategoryView = (categoryId: string, categoryName: string) => {
  pushToDataLayer({
    event: 'category_view',
    funnel_stage: 'awareness',
    event_category: 'navigation',
    event_action: 'view',
    event_label: categoryId,
    category_name: categoryName,
  });
};

export const trackArticleView = (articleSlug: string, category: string) => {
  pushToDataLayer({
    event: 'blog_article_view',
    funnel_stage: 'awareness',
    event_category: 'content',
    event_action: 'view',
    event_label: articleSlug,
    article_category: category,
  });
};

// ============ INTEREST STAGE ============

export const trackAIAssistantOpen = () => {
  pushToDataLayer({
    event: 'ai_assistant_open',
    funnel_stage: 'interest',
    event_category: 'engagement',
    event_action: 'open',
    event_label: 'dispute_assistant',
  });
};

export const trackTemplateView = (templateSlug: string, categoryId: string, templateName: string) => {
  pushToDataLayer({
    event: 'template_view',
    funnel_stage: 'interest',
    event_category: 'product',
    event_action: 'view',
    event_label: templateSlug,
    template_category: categoryId,
    template_name: templateName,
  });
};

export const trackBrowseTemplatesClick = (source: string) => {
  pushToDataLayer({
    event: 'browse_templates_click',
    funnel_stage: 'interest',
    event_category: 'engagement',
    event_action: 'click',
    event_label: source,
  });
};

export const trackCategoryCardClick = (categoryId: string, categoryName: string) => {
  pushToDataLayer({
    event: 'category_card_click',
    funnel_stage: 'interest',
    event_category: 'engagement',
    event_action: 'click',
    event_label: categoryId,
    category_name: categoryName,
  });
};

// ============ CONSIDERATION STAGE ============

export const trackLetterFormStart = (templateSlug: string) => {
  pushToDataLayer({
    event: 'letter_form_start',
    funnel_stage: 'consideration',
    event_category: 'form',
    event_action: 'start',
    event_label: templateSlug,
  });
};

export const trackLetterFormStep = (templateSlug: string, step: number) => {
  pushToDataLayer({
    event: 'letter_form_step',
    funnel_stage: 'consideration',
    event_category: 'form',
    event_action: 'step_complete',
    event_label: templateSlug,
    event_value: step,
    form_step: step,
  });
};

export const trackLetterPreviewView = (templateSlug: string) => {
  pushToDataLayer({
    event: 'letter_preview_view',
    funnel_stage: 'consideration',
    event_category: 'product',
    event_action: 'preview',
    event_label: templateSlug,
  });
};

export const trackToneSelected = (templateSlug: string, tone: string) => {
  pushToDataLayer({
    event: 'tone_selected',
    funnel_stage: 'consideration',
    event_category: 'form',
    event_action: 'select',
    event_label: tone,
    template_slug: templateSlug,
  });
};

export const trackJurisdictionSelected = (templateSlug: string, jurisdiction: string) => {
  pushToDataLayer({
    event: 'jurisdiction_selected',
    funnel_stage: 'consideration',
    event_category: 'form',
    event_action: 'select',
    event_label: jurisdiction,
    template_slug: templateSlug,
  });
};

// ============ CONVERSION STAGE ============

export const trackGenerateLetterClick = (templateSlug: string) => {
  pushToDataLayer({
    event: 'generate_letter_click',
    funnel_stage: 'conversion',
    event_category: 'product',
    event_action: 'generate',
    event_label: templateSlug,
  });
};

export const trackPricingModalOpen = (templateSlug: string) => {
  pushToDataLayer({
    event: 'pricing_modal_open',
    funnel_stage: 'conversion',
    event_category: 'ecommerce',
    event_action: 'view_pricing',
    event_label: templateSlug,
  });
};

export const trackCheckoutInitiated = (templateSlug: string, purchaseType: string, price: number) => {
  pushToDataLayer({
    event: 'checkout_initiated',
    funnel_stage: 'conversion',
    event_category: 'ecommerce',
    event_action: 'begin_checkout',
    event_label: templateSlug,
    event_value: price,
    purchase_type: purchaseType,
  });
};

export const trackPurchaseComplete = (
  templateSlug: string, 
  templateCategory: string,
  purchaseType: string, 
  price: number
) => {
  pushToDataLayer({
    event: 'purchase_complete',
    funnel_stage: 'conversion',
    event_category: 'ecommerce',
    event_action: 'purchase',
    event_label: templateSlug,
    event_value: price,
    purchase_type: purchaseType,
    template_category: templateCategory,
  });
};

export const trackDownloadPdf = (templateSlug: string) => {
  pushToDataLayer({
    event: 'download_pdf',
    funnel_stage: 'conversion',
    event_category: 'product',
    event_action: 'download',
    event_label: templateSlug,
    download_type: 'pdf',
  });
};

export const trackDownloadDocx = (templateSlug: string) => {
  pushToDataLayer({
    event: 'download_docx',
    funnel_stage: 'conversion',
    event_category: 'product',
    event_action: 'download',
    event_label: templateSlug,
    download_type: 'docx',
  });
};

// ============ RETENTION STAGE ============

export const trackSignupStarted = () => {
  pushToDataLayer({
    event: 'signup_started',
    funnel_stage: 'retention',
    event_category: 'auth',
    event_action: 'start',
    event_label: 'signup_page',
  });
};

export const trackSignupComplete = (method: 'email' | 'google') => {
  pushToDataLayer({
    event: 'signup_complete',
    funnel_stage: 'retention',
    event_category: 'auth',
    event_action: 'complete',
    event_label: method,
  });
};

export const trackLoginComplete = (method: 'email' | 'google') => {
  pushToDataLayer({
    event: 'login_complete',
    funnel_stage: 'retention',
    event_category: 'auth',
    event_action: 'login',
    event_label: method,
  });
};

export const trackGoogleAuthClick = (context: 'login' | 'signup') => {
  pushToDataLayer({
    event: 'google_auth_click',
    funnel_stage: 'retention',
    event_category: 'auth',
    event_action: 'click',
    event_label: `google_${context}`,
  });
};

export const trackDashboardView = () => {
  pushToDataLayer({
    event: 'dashboard_view',
    funnel_stage: 'retention',
    event_category: 'engagement',
    event_action: 'view',
    event_label: 'dashboard',
  });
};

// ============ CTA TRACKING ============

export const trackCTAClick = (ctaName: string, location: string) => {
  pushToDataLayer({
    event: 'cta_click',
    funnel_stage: 'interest',
    event_category: 'engagement',
    event_action: 'click',
    event_label: ctaName,
    cta_location: location,
  });
};

export const trackNavClick = (destination: string) => {
  pushToDataLayer({
    event: 'nav_click',
    funnel_stage: 'awareness',
    event_category: 'navigation',
    event_action: 'click',
    event_label: destination,
  });
};

// ============ SITE SEARCH ============

export const trackSiteSearch = (
  searchTerm: string,
  resultsCount: number,
  searchLocation: string
) => {
  pushToDataLayer({
    event: 'view_search_results',
    funnel_stage: 'interest',
    event_category: 'site_search',
    event_action: 'search',
    event_label: searchTerm,
    event_value: resultsCount,
    search_term: searchTerm,
    search_results_count: resultsCount,
    search_location: searchLocation,
  });
};
