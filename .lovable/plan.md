

# Simplified Per-Letter Pricing Plan

## Overview

Replace the current 3-tier pricing structure with a simple 2-option per-letter model that's easier to understand and reduces decision friction.

---

## New Pricing Model

| Option | Price | What You Get |
|--------|-------|--------------|
| **PDF Only** | $5.99 | Professional letter as downloadable PDF |
| **PDF + Editable** | $9.99 | PDF + Word document you can edit |

---

## Files to Modify

### 1. PricingModal.tsx (Letter Purchase Flow)
**Path:** `src/components/letter/PricingModal.tsx`

Replace the 3-tier card layout with a simpler 2-option design:
- Remove the `template.pricing` dependency (no longer need per-template pricing)
- Use hardcoded pricing tiers (or fetch from site_settings)
- Cleaner side-by-side or stacked layout
- Remove bundle offer section (simplify further)
- Update header text to reflect new model

**New structure:**
```text
┌────────────────────────┐  ┌────────────────────────┐
│      PDF Only          │  │    PDF + Editable      │
│        $5.99           │  │        $9.99           │
│                        │  │                        │
│  ✓ Professional letter │  │  ✓ Everything in PDF   │
│  ✓ PDF download        │  │  ✓ Editable Word doc   │
│  ✓ Ready to send       │  │  ✓ Make changes later  │
│                        │  │                        │
│     [Get PDF]          │  │  [Get PDF + Editable]  │
│                        │  │       RECOMMENDED      │
└────────────────────────┘  └────────────────────────┘
```

### 2. Pricing.tsx (Homepage Section)
**Path:** `src/components/home/Pricing.tsx`

Simplify from 3 plans to the 2-option per-letter model:
- Remove the three-card grid
- Show the two simple options
- Update the value explanation text
- Remove bundle offer for now (or keep as optional add-on)

### 3. PricingPage.tsx (Dedicated Pricing Page)
**Path:** `src/pages/PricingPage.tsx`

Update to match the simplified model:
- Two main pricing options
- Clear comparison of what's included
- Update the FAQ section to reflect new model
- Remove references to "Letter Pack" and "Unlimited" plans

### 4. letterTemplates.ts (Template Data)
**Path:** `src/data/letterTemplates.ts`

Two options:
- **Option A:** Remove the `pricing` field entirely from templates since pricing is now global
- **Option B:** Keep it but make it optional/ignored

Recommend **Option A** for cleaner code.

**Update PricingTier interface or remove it:**
```typescript
// Remove this from LetterTemplate interface:
// pricing: PricingTier[];

// Or make it optional:
pricing?: PricingTier[];
```

### 5. AdminSettings.tsx (Admin Panel)
**Path:** `src/pages/admin/AdminSettings.tsx`

Update payment settings to reflect new model:
- Rename `single_letter_price` → `pdf_only_price`
- Rename `letter_pack_price` → `pdf_editable_price`
- Remove `unlimited_monthly_price` (no subscription model for now)
- Update labels and descriptions

### 6. Database: site_settings table
Update the settings keys to match new pricing model:
- `pdf_only_price`: "5.99"
- `pdf_editable_price`: "9.99"
- Remove or deprecate old keys

---

## Visual Design Updates

### PricingModal Redesign
- 2 columns on desktop, stacked on mobile
- "Recommended" badge on PDF + Editable option
- Clear feature comparison
- Simpler, faster purchase flow

### Homepage Pricing Section
- Cleaner presentation with just 2 options
- Keep the "What you're paying for" explainer (it's good!)
- More prominent single CTA

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/letter/PricingModal.tsx` | Redesign to 2 simple options |
| `src/components/home/Pricing.tsx` | Simplify to 2 options |
| `src/pages/PricingPage.tsx` | Update plans and FAQ |
| `src/data/letterTemplates.ts` | Remove/make optional pricing field |
| `src/pages/admin/AdminSettings.tsx` | Update payment settings fields |
| Database migration | Update site_settings keys |

---

## Benefits of This Approach

1. **Zero decision fatigue** - PDF or PDF+Editable, that's it
2. **Clear value proposition** - customers instantly understand what they're getting
3. **Easier to explain** - "It's $5.99 for a PDF, or $9.99 if you want to edit it"
4. **Simpler codebase** - no per-template pricing complexity
5. **Easier to change** - pricing lives in one place (admin settings or constants)

---

## Optional Future Enhancements

Once the simple model is working, you could consider:
- **Bundle discount**: "Need multiple letters? Get 3 for $14.99 (PDF) or $24.99 (Editable)"
- **Legal references add-on**: "+$5 for jurisdiction-specific legal references" (if you want to keep that value-add)

But start simple and see how users respond.

