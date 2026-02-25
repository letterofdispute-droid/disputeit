

# Third-Pass Audit Results: Critical Findings

## Finding 1: CRITICAL -- siteContext.ts Slug Whitelist is Massively Wrong

The Dispute Assistant's slug whitelist (lines 110-228 of `siteContext.ts`) contains **~70 incorrect, hallucinated, or mismatched slugs**. This means the AI recommends templates that do not exist, causing broken links when users click recommendations.

Here is the full damage report by sub-file:

### Banking (12 actual templates, 5 wrong slugs in siteContext)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `nsf-fee-reversal-request` | `bank-nsf-fee-dispute` |
| `fund-availability-dispute` | `bank-fund-availability-hold-complaint` |
| `zelle-venmo-unauthorized-transfer` | `zelle-venmo-unauthorized-transfer-dispute` |
| `direct-debit-unauthorized-complaint` | *(duplicate of `unauthorized-direct-debit-dispute`, remove)* |
| `poa-recognition-demand` | `bank-power-of-attorney-recognition-demand` |

Missing from whitelist: `bank-account-freeze-dispute`

### Credit Cards (6 actual templates from creditCardTemplates + 1 core, 8 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `credit-card-annual-fee-dispute` | *(no template exists -- hallucinated)* |
| `charge-dispute-letter` | *(no template -- hallucinated)* |
| `statement-error-dispute` | *(no template -- hallucinated)* |
| `apr-increase-dispute` | `credit-card-interest-rate-increase-challenge` |
| `billing-error-dispute` | `credit-card-billing-error-dispute` |
| `rewards-dispute-letter` | `credit-card-rewards-points-dispute` |
| `promotional-apr-dispute` | `credit-card-promotional-apr-expiration-dispute` |
| `balance-transfer-fee-dispute` | `balance-transfer-dispute` |

Missing from whitelist: `credit-card-unauthorized-transaction-dispute`, `credit-card-late-fee-dispute`

### Credit Reporting (10 actual templates, 11 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `credit-bureau-dispute-letter` | *(hallucinated)* |
| `equifax-dispute-letter` | `credit-bureau-dispute-equifax` |
| `experian-dispute-letter` | `credit-bureau-dispute-experian` |
| `transunion-dispute-letter` | `credit-bureau-dispute-transunion` |
| `mixed-file-dispute` | `credit-report-mixed-file-dispute` |
| `inquiry-removal-request` | `unauthorized-credit-inquiry-removal` |
| `aged-debt-removal-request` | `credit-report-aged-debt-removal` |
| `duplicate-account-dispute` | `credit-report-duplicate-account-dispute` |
| `public-record-dispute` | `credit-report-public-record-error` |
| `payment-history-dispute` | `credit-report-incorrect-payment-history` |
| `investigation-violation-complaint` | `credit-report-investigation-violation` |

### Debt Collection (8 actual templates, 8 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `debt-validation-request` | `debt-validation-demand-letter` |
| `debt-collection-cease-desist` | `debt-collection-cease-desist-letter` |
| `time-barred-debt-dispute` | `time-barred-debt-defense-letter` |
| `harassment-complaint-debt-collector` | `debt-collector-harassment-complaint` |
| `third-party-contact-violation` | `debt-collector-third-party-contact-violation` |
| `paid-debt-still-reporting` | `paid-debt-still-collected-dispute` |
| `incorrect-amount-dispute` | `debt-collection-incorrect-amount-dispute` |
| `medical-debt-dispute` | `medical-debt-collection-dispute` |

### Identity Theft (8 actual templates, 8 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `identity-theft-affidavit-letter` | *(hallucinated)* |
| `fraudulent-account-closure-request` | `identity-theft-fraudulent-account-dispute` |
| `credit-freeze-dispute` | `credit-freeze-request-letter` |
| `fraud-alert-request` | `fraud-alert-request-letter` |
| `tax-identity-theft-complaint` | `tax-identity-theft-irs-letter` |
| `employment-fraud-dispute` | `employment-identity-theft-notification` |
| `medical-identity-theft-complaint` | `medical-identity-theft-dispute` |
| `phone-utility-fraud-dispute` | `identity-theft-phone-utility-fraud-dispute` |

### Investments (9 actual templates, 4 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `finra-complaint-letter` | `finra-arbitration-demand-letter` |
| `ponzi-scheme-complaint` | `ponzi-scheme-complaint-letter` |
| `pension-transfer-dispute` | `pension-transfer-complaint` |
| `retirement-account-dispute` | *(hallucinated -- no template)* |

Missing from whitelist: `fscs-claim-letter`

### Fraud & Scams (9 actual templates, 5 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `impersonation-scam-complaint` | `government-impersonation-scam-complaint` |
| `tech-support-scam-complaint` | `tech-support-scam-refund-claim` |
| `romance-scam-complaint` | `romance-pig-butchering-scam-bank-claim` |
| `pig-butchering-scam-complaint` | *(duplicate of above -- remove)* |
| `authorized-push-payment-fraud` | *(this is an ID not a slug, duplicate of `app-fraud-refund-claim`)* |
| `bank-security-breach-complaint` | `bank-security-failure-complaint` |

### Loans (6 actual, 2 wrong + 2 missing)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `mortgage-payment-dispute` | *(belongs in mortgage category, not loans)* |
| `loan-modification-request` | *(belongs in mortgage category, not loans)* |

Missing from whitelist: `ppi-mis-selling-claim`, `loan-payment-holiday-dispute`

### Mortgage (10 actual, ALL 12 siteContext entries wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `payment-misapplication-dispute` | `mortgage-payment-misapplication-dispute` |
| `escrow-analysis-dispute` | `mortgage-escrow-account-error-dispute` |
| `pmi-removal-request` | `pmi-removal-request-letter` |
| `loan-modification-request` | `mortgage-loan-modification-delay-complaint` |
| `foreclosure-defense-letter` | `foreclosure-during-modification-review-complaint` |
| `dual-tracking-complaint` | *(same template as above -- remove)* |
| `payoff-statement-dispute` | `mortgage-payoff-statement-error-dispute` |
| `heloc-dispute` | `heloc-freeze-challenge-letter` |
| `closing-cost-dispute` | `mortgage-closing-cost-dispute-respa` |
| `force-placed-insurance-complaint` | `force-placed-insurance-dispute` |
| `respa-qwr-letter` | *(hallucinated -- no template)* |
| `successor-interest-notice` | `mortgage-successor-in-interest-claim` |

### Vehicle (new templates, 4 wrong)

| siteContext slug (WRONG) | Actual slug |
|---|---|
| `spot-delivery-rescission` | `spot-delivery-fraud-complaint` |
| `kill-switch-removal-demand` | `electronic-kill-switch-complaint` |
| `gap-insurance-refund-request` | `gap-insurance-refund-demand` |
| `rate-markup-complaint` | `dealer-interest-rate-markup-complaint` |
| `title-branding-dispute` | *(hallucinated)* |
| `lease-end-dispute` | *(hallucinated)* |

---

## Finding 2: Subcategory Pattern Gaps (3 Remaining)

| Template ID | File | Expected | Actual | Fix |
|---|---|---|---|---|
| `account-closure-dispute` | bankingDisputeTemplates | Banking | General | Add `account-closure` to Banking pattern |
| `bank-fee-dispute` | core financialTemplates | Banking | General | Add `bank-fee` to Banking pattern |
| `fscs-claim` | investmentDisputeTemplates | Investments | General | Add `fscs` to Investments pattern |

---

## Finding 3: CATEGORIES Array Counts Still Wrong

The `CATEGORIES` array in siteContext (lines 12-27) has stale counts that were NOT updated in the last pass for most categories:

| Category | siteContext count | templateCategories count |
|---|---|---|
| Refunds | 15 | 50 |
| Housing | 14 | 50 |
| Travel | 12 | 20 |
| Healthcare | 50 | 50 |
| Damaged Goods | 8 | 50 |
| Utilities | 10 | 50 |
| Insurance | 14 | 50 |
| Employment | 14 | 50 |
| HOA | 5 | 50 |
| Contractors | 10 | 61 |

These should be synced with `templateCategories.ts` values.

---

## Implementation Plan

### File 1: `supabase/functions/_shared/siteContext.ts`
**Complete rewrite of the slug whitelist (lines 110-228)** using verified actual slugs from every template file. Also sync `CATEGORIES` counts with `templateCategories.ts`. This is the highest-priority fix -- without it the Dispute Assistant recommends broken links.

### File 2: `src/data/subcategoryMappings.ts`
- Add `account-closure|bank-fee` to Banking pattern
- Add `fscs` to Investments pattern

### Scope
Two files. The siteContext rewrite is large but mechanical -- every slug must be copied from the actual template source files.

