

# Fix Empty Subcategory Pages Across All Categories

## Root Cause

The `inferSubcategory()` function in `subcategoryMappings.ts` returns the **first** matching pattern. This creates ordering conflicts where broad patterns (like `/refund|return|money-back/`) capture templates before more specific patterns (like `/warranty|guarantee|defect/`) get a chance. The template `extended-warranty-refund` matches "Refunds" (pattern 1) instead of "Warranty" (pattern 2) because "refund" appears in its ID.

## Affected Subcategories

After auditing all 14 categories and their template IDs against the regex patterns:

### Confirmed Empty (need new templates)
1. **Refunds & Purchases > Warranty** - Only candidate (`extended-warranty-refund`) is captured by the "Refunds" pattern first. Needs 5-7 dedicated warranty templates with IDs that DON'T contain "refund/return".
2. **Refunds & Purchases > Delivery Issues** - Pattern `/delivery|shipping|late|missing/` catches `missing-items-order` (via "missing"), but that's only 1. Needs more delivery-focused templates.

### Potentially Thin (need verification + templates)
3. **Refunds & Purchases > Service Complaints** - Pattern `/service|poor-service|unsatisfactory/` may catch some service templates but "service" is very broad and also present in other patterns.
4. **Insurance > Life Insurance** - Has templates but need to verify the ID patterns match correctly (life-insurance-claim-denial matches `/life-|beneficiary|death-benefit/`).

## Plan

### Phase 1: Fix Pattern Ordering (subcategoryMappings.ts)
Reorder the "Refunds & Purchases" patterns so **specific** patterns come first:
1. Warranty (`/warranty|guarantee|defect/`) - FIRST
2. Subscriptions (`/subscription|recurring|cancel|auto-renew/`)
3. Delivery Issues (`/delivery|shipping|late|missing/`)
4. Service Complaints (`/service|poor-service|unsatisfactory/`)
5. Refunds (`/refund|return|money-back/`) - LAST (catch-all)

### Phase 2: Create Missing Templates

**Refunds > Warranty (6 templates)** - `src/data/templates/refunds/warrantyTemplates.ts`
Each template follows the existing format with full fields, sections, jurisdictions, SEO tags, pricing, and AI-enhanced fields:

1. `warranty-claim-denied` - Manufacturer refused to honor product warranty
2. `warranty-repair-unreasonable-delay` - Warranty repair taking months
3. `warranty-terms-misrepresentation` - Coverage misrepresented at sale
4. `implied-warranty-rights-letter` - Asserting Magnuson-Moss/UCC rights
5. `lifetime-guarantee-dispute` - "Lifetime guarantee" not honored
6. `defective-product-replacement` - Demanding warranty replacement

**Refunds > Delivery Issues (5 templates)** - `src/data/templates/refunds/deliveryIssueTemplates.ts`

1. `late-delivery-compensation` - Delivery missed promised date
2. `delivery-damage-complaint` - Item damaged during shipping
3. `delivery-never-arrived` - Package marked delivered but not received
4. `shipping-overcharge-refund` - Charged premium shipping, got standard
5. `delivery-partial-order` - Only part of order delivered

### Phase 3: Wire Up New Templates

Update `src/data/templates/refundsTemplates.ts`:
- Import `warrantyTemplates` and `deliveryIssueTemplates`
- Spread them into the combined export array

### Template Quality Standards (per template)
Each template will include:
- Unique `seoTitle` and `seoDescription` (no duplicate patterns)
- Full `longDescription` with "When to use" scenarios
- 8-12 form fields with `impactLevel`, `aiEnhanced`, `evidenceHint`, and `validation` attributes
- 5 sections (introduction, facts, request, deadline, closing)
- 4 jurisdictions (US, UK, EU, INTL) with specific legal references (Magnuson-Moss Act, Consumer Rights Act 2015, EU Consumer Sales Directive)
- 3 pricing tiers (Basic, Legal, Final Notice)
- 3 tones (neutral, firm, final)

### Files Changed
1. **Modify**: `src/data/subcategoryMappings.ts` - Reorder Refunds patterns
2. **Create**: `src/data/templates/refunds/warrantyTemplates.ts` (6 templates)
3. **Create**: `src/data/templates/refunds/deliveryIssueTemplates.ts` (5 templates)
4. **Modify**: `src/data/templates/refundsTemplates.ts` - Import and spread new template arrays

