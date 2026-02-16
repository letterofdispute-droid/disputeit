import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const GTM_ID = 'GTM-WX8PKJXH';
const STORAGE_KEY = 'cookie_consent';

export interface ConsentPreferences {
  analytics: boolean;
  functional: boolean;
  timestamp: string;
}

interface CookieConsentContextValue {
  consent: ConsentPreferences | null;
  hasConsented: boolean;
  showSettings: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (prefs: Pick<ConsentPreferences, 'analytics' | 'functional'>) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

// ---- Side-effect helpers (pure functions, no React) ----

let gtmInjected = false;

const injectGTM = () => {
  if (gtmInjected || typeof window === 'undefined') return;
  gtmInjected = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.insertBefore(script, document.head.firstChild);

  // noscript fallback
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
};

const pushConsentMode = (analyticsGranted: boolean) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'consent_update',
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
  });
};

const removeFontStylesheets = () => {
  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
    if (link.href?.includes('fonts.googleapis.com')) {
      link.remove();
    }
  });
  // Also remove preload
  document.querySelectorAll<HTMLLinkElement>('link[rel="preload"]').forEach((link) => {
    if (link.href?.includes('fonts.googleapis.com')) {
      link.remove();
    }
  });
};

const readConsent = (): ConsentPreferences | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeConsent = (prefs: ConsentPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

// ---- Provider ----

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => readConsent());
  const [showSettings, setShowSettings] = useState(false);

  const hasConsented = consent !== null;

  // Apply side-effects whenever consent changes
  useEffect(() => {
    if (!consent) return;

    if (consent.analytics) {
      injectGTM();
    }
    pushConsentMode(consent.analytics);

    if (!consent.functional) {
      removeFontStylesheets();
    }
  }, [consent]);

  const acceptAll = useCallback(() => {
    const prefs: ConsentPreferences = { analytics: true, functional: true, timestamp: new Date().toISOString() };
    writeConsent(prefs);
    setConsent(prefs);
  }, []);

  const rejectAll = useCallback(() => {
    const prefs: ConsentPreferences = { analytics: false, functional: false, timestamp: new Date().toISOString() };
    writeConsent(prefs);
    setConsent(prefs);
  }, []);

  const updateConsent = useCallback((partial: Pick<ConsentPreferences, 'analytics' | 'functional'>) => {
    const prefs: ConsentPreferences = { ...partial, timestamp: new Date().toISOString() };
    writeConsent(prefs);
    setConsent(prefs);
  }, []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({ consent, hasConsented, showSettings, acceptAll, rejectAll, updateConsent, openSettings, closeSettings }),
    [consent, hasConsented, showSettings, acceptAll, rejectAll, updateConsent, openSettings, closeSettings],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
};

export const useCookieConsent = (): CookieConsentContextValue => {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
};

/**
 * Non-hook helper to read consent synchronously (for modules outside React tree).
 * Returns null if no consent has been recorded yet.
 */
export const getConsentSync = readConsent;
