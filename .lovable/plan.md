

# Clean Up Dead Pricing Data and Fix SEO Currency

## What's happening

Your admin dashboard pricing works perfectly -- the `PricingModal` and homepage `Pricing` section both read from `useSiteSettings()` which pulls from the database. The Stripe checkout uses proper Price IDs. Everything that matters is dynamic.

The `standardPricing` arrays duplicated across 72 template files are **dead code** -- no component ever reads `template.pricing`. They're leftover from an earlier design.

## Changes

### 1. Fix the one real bug: SEOHead currency
`src/components/SEOHead.tsx` -- Change the default `currency` prop from `'EUR'` to `'USD'` so Google structured data shows the correct currency.

### 2. Remove dead `pricing` property from template type
`src/data/letterTemplates.ts` -- Remove the `pricing` field from the `LetterTemplate` interface since nothing uses it.

### 3. Remove `standardPricing` from all 72 template files
Strip out the `standardPricing` array definition and every `pricing: standardPricing` assignment across all template data files. This removes ~300 lines of dead code that could cause future confusion.

Affected directories:
- `src/data/templates/contractors/` (10 files)
- `src/data/templates/damagedGoods/` (5 files)
- `src/data/templates/ecommerce/` (5 files)
- `src/data/templates/employment/` (5 files)
- `src/data/templates/financial/` (5 files)
- `src/data/templates/hoa/` (5 files + parent)
- `src/data/templates/housing/` (5 files)
- `src/data/templates/insurance/` (6 files)
- `src/data/templates/refunds/` (5 files)
- `src/data/templates/utilities/` (5 files)
- `src/data/templates/vehicle/` (6 files)
- `src/data/templates/travelTemplates.ts`
- `src/data/templates/healthcareTemplates.ts`

### What stays the same
- Admin dashboard pricing controls -- already working correctly
- PricingModal -- already uses `useSiteSettings()`
- Stripe checkout -- already uses correct Price IDs
- Homepage pricing section -- already dynamic

