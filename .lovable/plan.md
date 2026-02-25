

# Fourth-Pass Audit: Remaining Issues Found

After verifying every slug in `siteContext.ts` against the actual template source files, I found significant gaps remaining in the E-commerce section and 3 missing Financial slugs.

---

## Finding 1: E-commerce Slug Whitelist -- 7 Wrong, 16 Missing

The E-commerce section of `siteContext.ts` (lines 216-233) was never fully verified against the actual template files. Cross-referencing reveals:

### 7 Wrong/Hallucinated Slugs

| siteContext slug (WRONG) | Actual slug | Source file |
|---|---|---|
| `dark-pattern-complaint` | No template exists | Hallucinated |
| `streaming-quality-complaint` | `streaming-service-complaint` | subscriptionTemplates |
| `account-suspended-appeal` | No template exists | Hallucinated |
| `data-deletion-request` | `account-deletion-request` | privacyDataTemplates |
| `gdpr-data-access-request` | `gdpr-data-portability` | privacyDataTemplates |
| `ccpa-data-deletion-request` | `ccpa-do-not-sell` | privacyDataTemplates |
| `seller-non-delivery-complaint` | No template exists | Hallucinated (closest: `package-not-received`) |

### 16 Missing Slugs (templates exist but not in whitelist)

**Core (ecommerceTemplates.ts):**
- `marketplace-seller-complaint`
- `data-privacy-request`

**Subscriptions (subscriptionTemplates.ts):**
- `streaming-service-complaint`
- `software-subscription-refund`
- `membership-fee-dispute`
- `gym-membership-cancellation`

**Payment & Refund (paymentRefundTemplates.ts):**
- `store-credit-cash-refund`
- `double-charge-dispute`

**Privacy & Data (privacyDataTemplates.ts):**
- `gdpr-data-deletion`
- `gdpr-data-portability`
- `ccpa-do-not-sell`
- `data-breach-notification-request`
- `marketing-opt-out`
- `cookie-consent-complaint`
- `account-deletion-request`
- `automated-decision-challenge`

---

## Finding 2: Financial Section -- 3 Missing Slugs from creditDisputeTemplates

The `creditDisputeTemplates.ts` file contains 6 templates. Three of them are correctly listed in siteContext (`credit-score-correction-request`, `late-payment-removal-request`, `default-notice-dispute`), but three are completely absent:

| Missing slug | Template file |
|---|---|
| `credit-limit-reduction-dispute` | creditDisputeTemplates.ts |
| `credit-application-denial-dispute` | creditDisputeTemplates.ts |
| `balance-transfer-dispute` | creditDisputeTemplates.ts |

These should appear under Credit Cards in siteContext since they map to the credit-cards subcategory.

---

## Finding 3: E-commerce Template Count Off By 1

Verified actual e-commerce template count:

| Sub-file | Count |
|---|---|
| marketplaceTemplates | 8 |
| subscriptionTemplates | 8 |
| consumerProtectionTemplates | 4 |
| deliveryShippingTemplates | 8 |
| paymentRefundTemplates | 7 |
| privacyDataTemplates | 8 |
| Core (ecommerceTemplates.ts) | 2 |
| **Total** | **45** |

`templateCategories.ts` says 44. Should be **45**.

---

## Finding 4: All Other Systems Verified Clean

- **Subcategory mappings**: All Financial, Vehicle, Mortgage, and E-commerce templates route to correct subcategories. No pattern conflicts remaining.
- **Mortgage in legalKnowledge.ts**: Present with RESPA, TILA, Dodd-Frank, HPA statutes.
- **Mortgage in categoryKnowledge.ts**: Present with Payment Issues, Escrow, PMI subcategories.
- **Form assistant**: Has `Real Estate & Mortgages` category expertise and subcategory-level expertise.
- **Financial, Vehicle, Mortgage slug whitelist sections**: All verified correct.
- **templateCategories.ts counts**: Financial (78), Vehicle (45), Mortgage (10) all correct.

---

## Implementation Plan

### File 1: `supabase/functions/_shared/siteContext.ts`

**E-commerce section rewrite (lines 216-233)**:
- Remove 7 wrong/hallucinated slugs
- Add 16 missing slugs
- Organize into the same sub-sections (Marketplace, Subscriptions, Account & Privacy, Consumer Protection, Delivery & Shipping, Payment & Refund)

**Financial section addition (around line 127)**:
- Add `credit-limit-reduction-dispute`, `credit-application-denial-dispute`, `balance-transfer-dispute` under Credit Cards

### File 2: `src/data/templateCategories.ts`

- Update E-commerce `templateCount` from 44 to **45**

### File 3: `supabase/functions/_shared/siteContext.ts` (CATEGORIES array)

- Update E-commerce count from 44 to **45** (line 23)

---

## Summary

| Issue | Count | Files |
|---|---|---|
| Wrong E-commerce slugs in siteContext | 7 | siteContext.ts |
| Missing E-commerce slugs in siteContext | 16 | siteContext.ts |
| Missing Financial slugs in siteContext | 3 | siteContext.ts |
| E-commerce template count wrong | 1 | templateCategories.ts, siteContext.ts |
| **Total fixes** | **27** | **2 files** |

All other systems (subcategory mappings, knowledge bases, form assistant, legal letter generator) are verified clean.

