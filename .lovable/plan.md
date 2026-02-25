

# Fifth-Pass Audit: CRITICAL -- Hundreds of Missing Slugs Across 10 Categories

## The Problem

Previous audits (passes 1-4) focused on Financial, E-commerce, Vehicle, and Mortgage categories. **Every other category was never audited against actual template files.** The result is devastating:

The siteContext whitelist contains only ~150 slugs total, but the actual template library has **550+ templates**. Roughly **400 template slugs are missing** from the Dispute Assistant's whitelist, meaning it cannot recommend ~73% of the template library.

## Category-by-Category Damage Report

| Category | Slugs in siteContext | Actual templates (approx) | Missing |
|---|---|---|---|
| **Healthcare** | 6 | ~50 | ~44 |
| **Refunds** | 15 | ~50 | ~35 |
| **Housing** | 12 | ~50 | ~38 |
| **Travel** | 6 | ~20 | ~14 |
| **Damaged Goods** | 10 | ~50 | ~40 |
| **Utilities** | 10 | ~50 | ~40 |
| **Insurance** | 14 | ~50 | ~36 |
| **Employment** | 14 | ~50 | ~36 |
| **HOA** | 5 | ~50 | ~45 |
| **Contractors** | 12 | ~61 | ~49 |
| **Financial** | OK | 78 | 0 |
| **E-commerce** | OK | 45 | 0 |
| **Vehicle** | OK | 45 | 0 |
| **Mortgage** | OK | 10 | 0 |
| **TOTAL** | ~150 | ~559 | **~377** |

### What's Missing Per Category (examples)

**Healthcare** (only 6 of ~50 whitelisted): Missing all insurance claim denial subtypes (medical-necessity, out-of-network, prior-authorization appeals), all medical billing subtypes (duplicate-charge, upcoding, unbundling, surprise-billing, No Surprises Act), all medical debt subtypes (validation, cease-communication, collection-agency), hospital complaints, HIPAA violations, and more.

**Refunds** (only 15 of ~50): Missing core templates like `refund-general`, `refund-online-purchase`, `refund-subscription`, `refund-after-return`, `refund-service-not-rendered`, `refund-overcharge`, `refund-double-charge`, plus retail complaint subtypes (`price-match-dispute`, `wrong-item-sent`, `restocking-fee-dispute`), service refund templates, and special purchase templates.

**Housing** (only 12 of ~50): Missing all repair/maintenance subtypes (`landlord-roof-leak-complaint`, `landlord-window-repair-request`, `landlord-flooring-repair-request`), letting agent templates, neighbor dispute templates, tenancy dispute templates, safety compliance templates.

**Travel** (only 6 of ~20): Missing `airline-flight-cancellation-compensation`, `airline-damaged-baggage-claim`, `airline-denied-boarding-compensation`, `hotel-refund-request`, `car-rental-complaint`, `cruise-complaint-letter`, `train-delay-compensation`, `travel-agency-complaint`, OTA refund, travel chargeback, missed connection, bus/coach, ferry, airport lounge, travel insurance appeal.

**Utilities** (only 10 of ~50): Missing entire telecom contract section (`early-termination-fee-dispute`, `cooling-off-cancellation`, `price-increase-exit`, `pac-code-request`), plus `premium-sms-dispute`, `international-call-dispute`, `direct-debit-error`, `credit-balance-refund`, `equipment-charge-dispute`, and many more.

**Insurance** (only 14 of ~50): Missing core templates (`insurance-claim-denial-appeal`, `insurance-claim-underpayment`, `insurance-claim-delay`, `insurance-cancellation-refund`), auto subtypes (`auto-glass-claim-dispute`, `rental-car-coverage-denial`, `diminished-value-claim`, `uninsured-motorist-claim`), life subtypes, and more.

**Employment** (only 14 of ~50): Missing `notice-period-dispute`, `retaliation-complaint`, `reasonable-accommodation-request`, `working-hours-dispute`, `contract-change-objection`, `unpaid-bonus-demand`, `minimum-wage-violation`, `holiday-pay-dispute`, `sick-pay-dispute`, `expense-reimbursement-demand`, `reference-request`, `reference-dispute`, `maternity-paternity-rights`, and more.

**HOA** (only 5 of ~50): Missing core templates (`hoa-complaint-letter`, `hoa-architectural-request`), violation subtypes (`hoa-violation-appeal`, `hoa-selective-enforcement-complaint`, `hoa-reasonable-accommodation-request`, `hoa-board-harassment-complaint`), neighbor subtypes (`neighbor-noise-complaint`, `neighbor-boundary-dispute`, `neighbor-tree-dispute`, `neighbor-parking-dispute`, `neighbor-pet-complaint`), and many more.

**Contractors** (only 12 of ~61): Missing all roofing subtypes, landscaping subtypes, kitchen/bath subtypes (`cabinet-installation-dispute`, `countertop-installation-dispute`, `tile-installation-failure`), specialty services (`pest-control-ineffective`, `pool-installation-dispute`, `fence-installation-dispute`), general contractor subtypes (`renovation-cost-overrun-dispute`, `contractor-delayed-completion`, `contractor-deposit-dispute`), and more.

## Implementation Plan

### File: `supabase/functions/_shared/siteContext.ts`

**Complete rewrite of the AVAILABLE TEMPLATE SLUGS section** for all 10 affected categories. Every slug must be extracted from the actual template source files. This is the same mechanical process done for Financial/E-commerce/Vehicle/Mortgage in previous passes, but applied to the remaining categories.

The rewrite will:
1. Extract every `slug:` value from every template file in each category's directory + core file
2. Replace the current whitelist section for each category
3. Organize slugs with sub-section comments matching the source file structure

### Scope
- 1 file: `supabase/functions/_shared/siteContext.ts`
- ~377 slug additions across 10 categories
- This is the single largest fix remaining and will bring the whitelist to full parity with the template library

### Why This Was Missed
Previous audits focused on the 62 "new" templates (Financial subtypes, Vehicle additions, Mortgage, E-commerce expansion). The original categories (Healthcare, Housing, Refunds, etc.) were also expanded with subdirectory template files, but those expansions were never cross-referenced against the siteContext whitelist.

