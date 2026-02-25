

# Plan: Deepen Form-Assistant Subcategory Expertise

## Problem

The `form-assistant` edge function (`supabase/functions/form-assistant/index.ts`) has two tiers of AI expertise:

1. **`categoryExpertise`** - One paragraph per category (all 14 covered)
2. **`subcategoryExpertise`** - Detailed per-subcategory entries with specific statutes, procedures, and validation rules

Currently, only **2 of 14 categories** have subcategory-level expertise:
- Financial (7 subcategories)
- Real Estate & Mortgages (4 subcategories)

The remaining **12 categories have zero subcategory entries**, meaning users get only generic category-level guidance regardless of their specific dispute type.

## What Changes

**1 file edited**: `supabase/functions/form-assistant/index.ts`

Expand `subcategoryExpertise` to cover all 14 categories, matching the subcategory slugs defined in `src/data/subcategoryMappings.ts`. Each entry includes specific statutes, procedures, deadlines, and validation rules.

### New Subcategory Entries by Category

| Category | Current Subcategories | New Subcategories to Add |
|---|---|---|
| Financial | 7 (credit-reporting, debt-collection, identity-theft, banking, credit-cards, investments, fraud) | 0 - already complete |
| Real Estate & Mortgages | 4 (payment-issues, escrow, pmi, foreclosure) | 3: closing, force-placed-insurance, inherited |
| Travel | 0 | 6: flights, hotels, cruises, car-rentals, tours, rail-bus |
| Insurance | 0 | 5: auto, home, health, life, travel |
| Housing | 0 | 6: repairs, deposits, tenancy, neighbor, letting-agents, safety |
| Contractors | 0 | 6: general, plumbing, electrical, roofing, hvac, specialty |
| Healthcare | 0 | 6: insurance-claims, billing, debt-collection, provider, pharmacy, privacy-records |
| Vehicle | 0 | 5: dealer, repair, warranty-lemon, finance, parking |
| Utilities & Telecom | 0 | 5: energy, water, internet, phone, tv-cable |
| E-commerce | 0 | 6: refunds, delivery, marketplace, subscriptions, privacy, consumer-protection |
| Employment | 0 | 6: wages, termination, discrimination, benefits, workplace, retaliation |
| HOA & Property | 0 | 5: fees, violations, maintenance, neighbor, governance |
| Refunds & Purchases | 0 | 5: refunds, warranty, subscriptions, delivery, service |
| Damaged Goods | 0 | 4: delivery-damage, defective, misrepresentation, warranty-repair |

**Total: ~68 new subcategory expertise entries** added to the existing 11 (7 Financial + 4 Mortgage).

### Content per Entry

Each subcategory entry is a focused multi-line string containing:
- **Applicable statutes** with specific USC/CFR sections or state law references
- **Key procedures** (filing deadlines, notice requirements, escalation steps)
- **Validation rules** (what evidence strengthens the case, common pitfalls)
- **Regulatory contact points** (which agency to file with)

Example for Travel > flights:
```
Deep expertise in airline flight disputes:
- DOT passenger protections: tarmac delay rules (3hrs domestic, 4hrs international)
- Denied boarding compensation: 200%-400% of one-way fare under 14 CFR 250
- Refund rules: airlines must refund within 7 days (credit card) or 20 days (cash/check)
- Automatic refund rule for significant delays and cancellations (2024 DOT final rule)
- Baggage fee refunds for significantly delayed checked bags
- Disability accommodation requirements under Air Carrier Access Act
```

### How It Integrates

The existing code at lines 253-258 already handles the merge logic:

```typescript
let expertise = categoryExpertise[category] || '...';
const subExpertise = subcategory && subcategoryExpertise[category]?.[subcategory];
if (subExpertise) {
  expertise += '\n\n' + subExpertise;
}
```

No logic changes needed. The subcategory slug is passed from the frontend via the `subcategory` field in the request body, which is already inferred by `inferSubcategory()` in the UI layer.

### Scope
- **1 file edited**: `supabase/functions/form-assistant/index.ts` (expanding `subcategoryExpertise` object)
- **No new files, no schema changes, no new dependencies**
- Edge function auto-deploys on save

