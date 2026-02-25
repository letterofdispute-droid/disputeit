

# Verification Results: Template Count Mismatches and Subcategory Pattern Bugs

After a thorough audit of every template file in the project, I found three categories of issues that need fixing.

---

## Issue 1: Template Count Mismatches in `templateCategories.ts`

The `templateCount` field is hardcoded and has drifted from reality. Here are the verified actual counts vs. what is displayed:

```text
Category              Listed    Actual    Delta
────────────────────  ──────    ──────    ─────
Financial Services       94        78      -16
Vehicle & Auto           54        45       -9
E-commerce               54       ~45      ~-9
```

### Financial Services Breakdown (verified count: 78)

| Sub-file                     | Templates |
|------------------------------|-----------|
| Core (financialTemplates.ts) | 4         |
| bankingDisputeTemplates      | 12        |
| creditCardTemplates          | 6         |
| creditDisputeTemplates       | 6         |
| creditReportingTemplates     | 10        |
| debtCollectionTemplates      | 8         |
| identityTheftTemplates       | 8         |
| loanDisputeTemplates         | 6         |
| investmentDisputeTemplates   | 9         |
| scamFraudTemplates           | 9         |
| **Total**                    | **78**    |

### Vehicle & Auto Breakdown (verified count: 45)

| Sub-file                     | Templates |
|------------------------------|-----------|
| dealerComplaintTemplates     | 9         |
| parkingTrafficTemplates      | 8         |
| garageRepairTemplates        | 6         |
| warrantyLemonLawTemplates    | 6         |
| financeLeaseTemplates        | 6         |
| additionalVehicleTemplates   | 10        |
| **Total**                    | **45**    |

### Fix
Update `templateCategories.ts` to use correct counts: Financial = 78, Vehicle = 45. For E-commerce, I will do a final count during implementation.

**Better long-term fix**: Replace hardcoded `templateCount` with a computed value derived from `getTemplatesByCategory()` at build time, so counts never drift again.

---

## Issue 2: Subcategory Pattern Conflicts in `subcategoryMappings.ts`

The Financial subcategory patterns have ordering and specificity bugs that cause templates to land in the wrong subcategory:

| Template ID                          | Expected Subcategory | Actual Match     | Why                                     |
|--------------------------------------|---------------------|------------------|-----------------------------------------|
| `zelle-venmo-unauthorized-transfer`  | Banking             | Fraud & Scams    | `unauthorized` matches fraud pattern    |
| `direct-debit-unauthorized`          | Banking             | Fraud & Scams    | `unauthorized` matches fraud pattern    |
| `account-takeover-complaint`         | Fraud & Scams       | Banking          | `account` matches banking pattern first |
| `interest-rate-dispute`              | Banking             | Credit Cards     | `interest` matches credit-cards pattern |
| `standing-order-dispute`             | Banking             | General (no match) | No pattern matches                    |
| `credit-limit-reduction-dispute`     | Credit Cards        | General          | No pattern matches                     |
| `credit-application-denial`          | Credit Cards        | General          | No pattern matches                     |
| `balance-transfer-dispute`           | Credit Cards        | General          | No pattern matches                     |
| `late-payment-removal-request`       | Credit Reporting    | General          | No pattern matches                     |
| `default-notice-dispute`             | Debt Collection     | General          | No pattern matches                     |

### Fix
1. Make the banking pattern more specific: add `zelle|venmo|direct-debit|standing-order|interest-rate-dispute` and remove the generic `account` match
2. Make the credit-cards pattern include: `credit-limit|credit-application|balance-transfer`
3. Make the credit-reporting pattern include: `late-payment-removal`
4. Make the debt-collection pattern include: `default-notice`
5. Make the fraud pattern exclude banking terms by reordering (banking should be checked before fraud) and narrowing `unauthorized` to `unauthorized.*fraud|unauthorized.*transaction` or moving specific banking IDs before the fraud check
6. Exclude `account-takeover` from the banking pattern by using `bank-account|checking-account|savings-account` instead of bare `account`

---

## Issue 3: Template Routing Verification

The user's current route (`/templates/financial/identity-theft/identity-theft-ftc-report-cover-letter`) resolves correctly:
- Template `identity-theft-ftc-report-cover-letter` exists in `identityTheftTemplates.ts`
- The `inferSubcategory` function correctly maps ID `identity-theft-ftc-report-cover` to the `identity-theft` subcategory
- Route pattern `/templates/:categoryId/:subcategorySlug/:templateSlug` matches

No routing issues found for the new templates.

---

## Implementation Plan

### File: `src/data/templateCategories.ts`
- Update `templateCount` for Financial from 94 to 78
- Update `templateCount` for Vehicle from 54 to 45
- Verify and update E-commerce count (estimated ~45, need final count)

### File: `src/data/subcategoryMappings.ts`
- Fix the Financial patterns to resolve all 10 misclassification bugs listed above
- Specifically:
  - Banking pattern: replace `bank|account` with `bank|checking|savings|atm|branch|overdraft|wire-transfer|nsf|fund-availability|zelle|venmo|direct-debit|standing-order|poa-recognition|interest-rate-dispute`
  - Credit Cards pattern: add `credit-limit|credit-application|balance-transfer`
  - Credit Reporting pattern: add `late-payment-removal`
  - Debt Collection pattern: add `default-notice`
  - Fraud pattern: narrow `unauthorized` to avoid matching banking templates, add `account-takeover` explicitly

### Optional Enhancement
- Add a dev-time validation script or console warning that flags templates falling to "General" subcategory, to catch future drift automatically

