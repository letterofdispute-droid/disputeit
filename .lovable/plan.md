

# Google Tag Manager Installation & Funnel Tracking Optimization

## Overview

This plan installs Google Tag Manager (GTM-WX8PKJXH) across the entire site and implements a comprehensive tracking system with custom data layer events for every key user interaction. This will give you clear funnel visibility in Google Analytics.

---

## Part 1: GTM Installation

### 1.1 Update index.html

Add GTM scripts to the HTML file:
- Head script (JavaScript) - as high as possible in `<head>`
- Body noscript (iframe fallback) - immediately after opening `<body>` tag

---

## Part 2: Create GTM Tracking Hook

### 2.1 New File: `src/hooks/useGTM.ts`

A centralized hook for pushing events to GTM's dataLayer:

```typescript
// Event categories for funnel tracking
type FunnelStage = 
  | 'awareness'      // Homepage, category views
  | 'interest'       // Template views, AI assistant opened
  | 'consideration'  // Form started, form steps
  | 'conversion'     // Purchase initiated, purchase complete
  | 'retention';     // Login, dashboard access

// Standard event structure
interface GTMEvent {
  event: string;
  funnel_stage: FunnelStage;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  // Additional data
  [key: string]: any;
}
```

---

## Part 3: Funnel Events to Track

### 3.1 Awareness Stage (Top of Funnel)
| Event | Trigger | Location |
|-------|---------|----------|
| `page_view` | Page load | All pages |
| `homepage_view` | Homepage loaded | Index.tsx |
| `category_view` | Category page loaded | CategoryPage.tsx |
| `blog_article_view` | Article viewed | ArticlePage.tsx |

### 3.2 Interest Stage
| Event | Trigger | Location |
|-------|---------|----------|
| `ai_assistant_open` | AI search/assistant opened | Hero.tsx |
| `template_view` | Template page loaded | LetterPage.tsx |
| `browse_templates_click` | Browse templates CTA clicked | Hero.tsx |
| `category_card_click` | Category card clicked | LetterCategories.tsx |

### 3.3 Consideration Stage
| Event | Trigger | Location |
|-------|---------|----------|
| `letter_form_start` | Form interaction begins | LetterGenerator.tsx |
| `letter_form_step` | Step 1, 2, or 3 completed | LetterGenerator.tsx |
| `letter_preview_view` | Preview modal opened | LetterGenerator.tsx |
| `tone_selected` | Tone choice made | LetterGenerator.tsx |
| `jurisdiction_selected` | Jurisdiction selected | LetterGenerator.tsx |

### 3.4 Conversion Stage
| Event | Trigger | Location |
|-------|---------|----------|
| `generate_letter_click` | Generate button clicked | LetterGenerator.tsx |
| `pricing_modal_open` | Pricing modal shown | LetterGenerator.tsx |
| `checkout_initiated` | Purchase button clicked | PricingModal.tsx |
| `purchase_complete` | Successful purchase | PurchaseSuccessPage.tsx |
| `download_pdf` | PDF downloaded | PurchaseSuccessPage.tsx |
| `download_docx` | DOCX downloaded | PurchaseSuccessPage.tsx |

### 3.5 Retention Stage
| Event | Trigger | Location |
|-------|---------|----------|
| `signup_started` | Signup page loaded | SignupPage.tsx |
| `signup_complete` | Account created | SignupPage.tsx |
| `login_complete` | User logged in | LoginPage.tsx |
| `google_auth_click` | Google OAuth clicked | LoginPage/SignupPage |
| `dashboard_view` | Dashboard accessed | Dashboard.tsx |

---

## Part 4: Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Add GTM head script and body noscript |
| `src/hooks/useGTM.ts` | **NEW** - Create GTM tracking hook |
| `src/components/home/Hero.tsx` | Track CTA clicks, AI assistant open |
| `src/components/home/LetterCategories.tsx` | Track category card clicks |
| `src/components/home/Pricing.tsx` | Track pricing CTA clicks |
| `src/components/letter/LetterGenerator.tsx` | Track form steps, preview, generate |
| `src/components/letter/PricingModal.tsx` | Track checkout initiated |
| `src/pages/Index.tsx` | Track homepage view |
| `src/pages/LetterPage.tsx` | Track template view |
| `src/pages/CategoryPage.tsx` | Track category view |
| `src/pages/LoginPage.tsx` | Track login events |
| `src/pages/SignupPage.tsx` | Track signup events |
| `src/pages/PurchaseSuccessPage.tsx` | Track purchase complete, downloads |
| `src/pages/ArticlePage.tsx` | Track article views |
| `src/components/layout/Header.tsx` | Track navigation clicks |

---

## Part 5: Data Layer Structure

Events will push to `window.dataLayer` with consistent structure:

```javascript
// Example: User clicks "Start Your Dispute" on hero
window.dataLayer.push({
  event: 'cta_click',
  funnel_stage: 'awareness',
  event_category: 'engagement',
  event_action: 'click',
  event_label: 'hero_start_dispute',
  page_path: '/'
});

// Example: User completes purchase
window.dataLayer.push({
  event: 'purchase_complete',
  funnel_stage: 'conversion',
  event_category: 'ecommerce',
  event_action: 'purchase',
  event_label: 'landlord-repair-request',
  event_value: 9.99,
  purchase_type: 'pdf-editable',
  template_slug: 'landlord-repair-request',
  template_category: 'housing'
});
```

---

## Part 6: GTM Configuration Recommendations

After deployment, configure in GTM dashboard:

### Tags to Create
1. **GA4 Configuration Tag** - Base tracking
2. **GA4 Event Tags** - For each custom event
3. **Conversion Linker** - For cross-domain tracking

### Triggers to Create
1. Custom Event triggers for each `event` name
2. Page View trigger for standard analytics

### Variables to Create
1. Data Layer Variables for: `funnel_stage`, `event_category`, `event_action`, `event_label`, `event_value`

---

## Expected Funnel Visualization

After implementation, you'll be able to create this funnel in GA4:

```text
Homepage View (100%)
       ↓
Category/Template View (60%)
       ↓
Form Started (35%)
       ↓
Form Step 2 (28%)
       ↓
Form Step 3 (22%)
       ↓
Generate Click (18%)
       ↓
Pricing Modal Open (18%)
       ↓
Checkout Initiated (8%)
       ↓
Purchase Complete (5%)
```

---

## Technical Notes

- GTM scripts load asynchronously to avoid blocking page render
- Events use consistent naming convention: `snake_case`
- All events include `page_path` for context
- User ID is included when authenticated (for cross-device tracking)
- No PII is sent to GTM/GA (email addresses, names are excluded)

