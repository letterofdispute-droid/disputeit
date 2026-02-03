
# Privacy Policy Page Creation

## Overview

Create a comprehensive Privacy Policy page at `/privacy` with GDPR (EU) and CCPA (California) compliant content, following the established pattern from the Terms of Service page.

---

## Page Structure

The Privacy Policy will include 15 sections covering all major privacy regulations:

### Section Outline

| # | Section | Purpose |
|---|---------|---------|
| 1 | Introduction | Company identity and policy scope |
| 2 | Information We Collect | Types of personal data gathered |
| 3 | How We Collect Information | Methods (forms, cookies, automatic) |
| 4 | How We Use Your Information | Legal bases for processing |
| 5 | Information Sharing | Third parties and data transfers |
| 6 | Data Retention | How long data is kept |
| 7 | Your Privacy Rights | GDPR + CCPA rights summary |
| 8 | GDPR Rights (EU Residents) | Right to access, erasure, portability, etc. |
| 9 | CCPA Rights (California Residents) | Right to know, delete, opt-out, non-discrimination |
| 10 | Cookies and Tracking | Cookie policy and controls |
| 11 | Data Security | Security measures in place |
| 12 | International Data Transfers | Cross-border data handling |
| 13 | Children's Privacy | Age requirements (18+) |
| 14 | Changes to This Policy | Update notification process |
| 15 | Contact Information | Data controller contact details |

---

## Technical Implementation

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/PrivacyPage.tsx` | Create |
| `src/App.tsx` | Add route |
| `src/routes.ts` | Add to static routes |

### PrivacyPage Component

```tsx
// Key structure
<Layout>
  <SEOHead 
    title="Privacy Policy | DisputeLetters"
    description="Learn how DisputeLetters collects, uses, and protects your personal information. GDPR and CCPA compliant privacy practices."
    canonicalPath="/privacy"
  />
  
  <div className="container-wide py-12 md:py-16">
    <div className="max-w-4xl mx-auto">
      {/* Header with last updated date */}
      {/* Table of Contents for quick navigation */}
      {/* 15 sections with consistent styling */}
    </div>
  </div>
</Layout>
```

### App.tsx Update

```tsx
import PrivacyPage from "./pages/PrivacyPage";
// ...
<Route path="/privacy" element={<PrivacyPage />} />
```

### routes.ts Update

```tsx
export const routes = [
  // ... existing routes
  '/privacy',
  // ...
];
```

---

## Content Details

### Information We Collect

**Personal Information:**
- Name and email (account creation)
- Dispute details entered in letter forms
- Payment information (processed by Stripe, not stored by us)

**Automatically Collected:**
- IP address, browser type, device information
- Usage data (pages visited, time spent)
- Cookies and similar technologies

### Legal Bases for Processing (GDPR)

- **Contract Performance**: Processing purchases and generating letters
- **Legitimate Interests**: Improving service, fraud prevention
- **Consent**: Marketing communications (opt-in)

### GDPR Rights Covered

- Right to Access
- Right to Rectification
- Right to Erasure ("Right to be Forgotten")
- Right to Data Portability
- Right to Restrict Processing
- Right to Object
- Right to Withdraw Consent
- Right to Lodge a Complaint

### CCPA Rights Covered

- Right to Know (what data is collected)
- Right to Delete
- Right to Opt-Out of Sale (we do NOT sell data)
- Right to Non-Discrimination

### Third-Party Services Mentioned

- Stripe (payment processing)
- Analytics services
- Hosting providers

---

## Visual Styling

- Follows TermsPage pattern with `prose` typography
- Highlighted GDPR/CCPA sections in colored boxes
- Table of Contents with anchor links for easy navigation
- Contact information in styled card at bottom

---

## SEO Optimization

- Comprehensive meta description mentioning GDPR/CCPA
- Canonical URL set to `/privacy`
- Proper heading hierarchy (h1, h2, h3)
- Added to static routes for pre-rendering
