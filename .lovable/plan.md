
# Cookie Consent Management Platform (CMP)

## Overview
Build a custom, GDPR and UK ePrivacy-compliant cookie consent system that blocks all non-essential third-party services (GTM, reCAPTCHA, Google Fonts) until the user explicitly grants consent. The banner will match the existing Letter of Dispute design language.

## What Users Will See

**First Visit:** A bottom-anchored banner appears with:
- A brief explanation: "We use cookies to improve your experience and analyse site traffic."
- Three buttons: **Accept All**, **Reject All**, **Manage Preferences**
- A link to the Privacy Policy

**Manage Preferences (expandable panel):** Grouped toggles for:
- **Essential** (always on, greyed out) -- authentication, security, core functionality
- **Analytics** -- Google Tag Manager, GA4, site analytics
- **Functional** -- Google Fonts (loaded from CDN)

**Returning Visitors:** Banner is hidden. A small "Cookie Settings" link in the footer lets users change preferences at any time.

## How It Works

```text
Page Load
  |
  v
Check localStorage("cookie_consent")
  |
  +-- Not found --> Show banner, block GTM + reCAPTCHA + Google Fonts
  |
  +-- Found --> Read preferences
        |
        +-- analytics: true  --> Load GTM, push consent mode
        +-- analytics: false --> Do nothing (GTM never injected)
        +-- functional: true --> Keep Google Fonts
        +-- functional: false --> Remove font stylesheet
```

**Key compliance points:**
- GTM script is NOT loaded in index.html anymore -- it is injected dynamically only after consent
- reCAPTCHA is already loaded dynamically (only on login/signup pages) -- will be gated behind analytics consent
- Google Fonts stylesheet is loaded by default but removed if functional cookies are rejected
- dataLayer gets a `consent_update` event so GTM's built-in Consent Mode can enforce per-tag blocking

## Technical Plan

### 1. Consent Context and Hook

**New: `src/hooks/useCookieConsent.ts`**

A React context + hook that:
- Reads/writes consent state from `localStorage` key `cookie_consent`
- Stores: `{ analytics: boolean, functional: boolean, timestamp: string }`
- Exposes: `consent`, `hasConsented`, `acceptAll()`, `rejectAll()`, `updateConsent(prefs)`, `openSettings()`
- On `acceptAll` or category-level accept: dynamically injects GTM script (moved from `main.tsx`)
- Pushes Google Consent Mode defaults (`analytics_storage`, `ad_storage`) to dataLayer

### 2. Cookie Banner Component

**New: `src/components/cookie/CookieBanner.tsx`**

- Fixed to bottom of viewport, z-index above everything except modals
- Renders only when `hasConsented === false`
- Three buttons: Accept All (primary), Reject All (outline), Manage Preferences (text link)
- Smooth slide-up animation using framer-motion (already installed)
- Responsive: stacks vertically on mobile

### 3. Cookie Preferences Modal

**New: `src/components/cookie/CookiePreferencesModal.tsx`**

- Opens from "Manage Preferences" button or footer link
- Uses existing Radix Dialog component
- Three category rows with Switch toggles:
  - Essential (locked on)
  - Analytics (GTM, GA4, reCAPTCHA)
  - Functional (Google Fonts CDN)
- "Save Preferences" button applies choices and closes

### 4. GTM Gating -- Remove Eager Loading

**Modified: `index.html`**
- Remove the inline GTM `<script>` block from `<head>` (lines 5-10)
- Remove the GTM `<noscript>` iframe from `<body>` (lines 80-82)
- GTM will now ONLY be loaded via JavaScript after consent

**Modified: `src/main.tsx`**
- Remove the `initGTM()` call -- GTM initialization moves into the consent hook
- Keep the loading overlay logic

**Modified: `scripts/inject-homepage-content.mjs`**
- No changes needed (only injects loading overlay)

### 5. GTM Consent Mode Integration

When consent is granted, push to dataLayer:
```javascript
window.dataLayer.push({
  event: 'consent_update',
  analytics_storage: 'granted',
  ad_storage: 'denied', // we don't run ads
});
```

When rejected:
```javascript
window.dataLayer.push({
  event: 'consent_update', 
  analytics_storage: 'denied',
  ad_storage: 'denied',
});
```

This lets any tags configured in GTM respect consent natively.

### 6. reCAPTCHA Consent Gating

**Modified: `src/hooks/useRecaptcha.ts`**
- Before loading the reCAPTCHA script, check if analytics consent is granted
- If not consented, skip reCAPTCHA gracefully (existing fallback already returns `{ success: true }`)

### 7. Google Fonts Consent Gating

**Modified: `index.html`**
- Google Fonts stylesheet stays in HTML (functional cookies default)
- If user rejects functional cookies, the consent hook removes the stylesheet link from the DOM
- A CSS fallback using system fonts (`Inter` -> system-ui, `Lora` -> Georgia) is already defined in `--font-sans` and `--font-serif`

### 8. Footer "Cookie Settings" Link

**Modified: `src/components/layout/Footer.tsx`**
- Add a "Cookie Settings" button in the Legal column that opens the preferences modal

### 9. Wire Into App

**Modified: `src/App.tsx`**
- Wrap the app with `<CookieConsentProvider>`
- Add `<CookieBanner />` inside the provider (renders conditionally)

### 10. Analytics Hook Update

**Modified: `src/hooks/useAnalytics.ts`**
- Before inserting into `analytics_events` table, check consent status
- If analytics not consented, skip the insert (our own first-party analytics should also respect consent)

**Modified: `src/hooks/useGTM.ts`**
- `pushToDataLayer` checks if consent is granted before pushing events (GTM won't be loaded anyway, but belt-and-suspenders)

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/useCookieConsent.tsx` | Create -- context, hook, GTM loader |
| `src/components/cookie/CookieBanner.tsx` | Create -- bottom banner UI |
| `src/components/cookie/CookiePreferencesModal.tsx` | Create -- category toggles modal |
| `index.html` | Modify -- remove GTM script tags |
| `src/main.tsx` | Modify -- remove `initGTM()` |
| `src/App.tsx` | Modify -- add CookieConsentProvider + CookieBanner |
| `src/components/layout/Footer.tsx` | Modify -- add Cookie Settings link |
| `src/hooks/useRecaptcha.ts` | Modify -- gate behind consent |
| `src/hooks/useAnalytics.ts` | Modify -- gate behind consent |
| `src/hooks/useGTM.ts` | Modify -- gate behind consent |

## Design Details

- Banner background: `bg-card` with `border-t border-border` (matches footer)
- Accept All button: primary style (deep slate blue)
- Reject All button: outline variant
- Text: `text-sm text-muted-foreground` with `text-foreground` headings
- Slide-up animation from bottom (300ms ease-out)
- Mobile: full-width, stacked buttons
- Desktop: horizontal layout with text left, buttons right
