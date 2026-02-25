

# Mega Menu Audit — Issues Found

## Problem 1: Broken Description Truncation (Most Visible)
Line 93 uses `category.description.split('.')[0].split(',')[0]` to shorten descriptions. This produces wildly inconsistent results because some descriptions have early commas and some don't:

| Category | Full description | After split |
|----------|-----------------|-------------|
| Refunds & Purchases | "Get your money back for products or services that did not meet expectations." | Full sentence (no early comma) — wraps to 3 lines |
| Landlord & Housing | "Request repairs, address deposit disputes, or document housing issues." | "Request repairs" — 1 line |
| Financial Services | "Challenge bank fees, credit report errors, identity theft..." | "Challenge bank fees" — 1 line |
| Damaged & Defective Goods | "File complaints for items that arrived broken, defective, or not as described." | "File complaints for items that arrived broken" — 2 lines |

This creates **uneven row heights** across the 3-column grid, making it look broken.

**Fix:** Write dedicated short descriptions (max ~6 words each) as a `shortDescription` map inside MegaMenu, instead of splitting the category's long description. Every item gets one consistent line.

## Problem 2: Guides Footer Says "templates"
The `CategoryGrid` component always shows `{totalCount}+ templates` in the footer, even when used for the Guides dropdown. Should say "guides" for Guides.

**Fix:** Add a `footerUnit` prop to `CategoryGrid` (default "templates") and pass "guides" from the Guides menu item.

## Problem 3: Both Menus Show Identical Content
Letter Templates and Guides render the same 13 categories. This is by design (same categories, different base paths), but worth noting — not a bug to fix here.

## File Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | 1. Replace the `split('.')` logic with a static `shortDescriptions` map (one short phrase per category). 2. Add `footerUnit` prop to `CategoryGrid` so Guides says "guides" not "templates". |

## Short Descriptions Map (proposed)

```typescript
const shortDescriptions: Record<string, string> = {
  'refunds': 'Product & service refunds',
  'housing': 'Repairs, deposits & tenancy',
  'travel': 'Flights, hotels & bookings',
  'damaged-goods': 'Broken or defective items',
  'utilities': 'Billing & service disputes',
  'financial': 'Banks, credit & debt',
  'insurance': 'Claims & coverage issues',
  'vehicle': 'Dealers, repairs & lemon law',
  'healthcare': 'Medical bills & denials',
  'employment': 'Wages & workplace issues',
  'ecommerce': 'Online sellers & accounts',
  'hoa': 'HOA fees & neighbor issues',
  'contractors': 'Workmanship & project issues',
};
```

Each description is 3–5 words, ensuring uniform single-line height across all columns.

