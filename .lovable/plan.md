
# Pricing Model Update + Human-Crafted Trust Indicator

## Overview

This plan implements a three-tier pricing model with a new monthly subscription option, updates prices across the entire site, and adds a subtle "human-crafted" trust indicator near the letter forms.

## New Pricing Structure

| Tier | Current | New | Type |
|------|---------|-----|------|
| PDF Only | $5.99 | **$9.99** | One-time |
| PDF + Editable | $9.99 | **$14.99** | One-time |
| Unlimited Monthly | N/A | **$24.99/mo** | Subscription (NEW) |

## Implementation Scope

### Part 1: Stripe Configuration

1. **Create new Stripe products and prices:**
   - Update existing "Letter PDF Only" price to $9.99 (create new price, keep old for existing purchases)
   - Update existing "Letter PDF + Editable" price to $14.99 (create new price)
   - Create new "Unlimited Monthly" subscription product at $24.99/month

### Part 2: Frontend Updates

**Files to modify:**

| File | Changes |
|------|---------|
| `src/components/letter/PricingModal.tsx` | Update prices to $9.99 / $14.99, add subscription option |
| `src/components/home/Pricing.tsx` | Update prices, add subscription tier card |
| `src/pages/PricingPage.tsx` | Add subscription tier, update all prices, update schema |
| `src/pages/Index.tsx` | No changes needed (uses Pricing component) |

### Part 3: Edge Function Updates

**Files to modify:**

| File | Changes |
|------|---------|
| `supabase/functions/create-letter-checkout/index.ts` | Update price IDs and amounts |
| NEW: `supabase/functions/check-subscription/index.ts` | Verify active subscription status |
| NEW: `supabase/functions/create-subscription-checkout/index.ts` | Create subscription checkout session |

### Part 4: Subscription Infrastructure

1. **Database updates:**
   - Add `subscription_status` and `subscription_end` columns to `profiles` table
   - Track which users have active unlimited subscriptions

2. **Auth context updates:**
   - Add subscription checking on login
   - Provide `hasUnlimitedAccess` flag to components

3. **UI logic updates:**
   - If user has active subscription, skip pricing modal and generate letter directly
   - Show "Manage Subscription" button in dashboard

### Part 5: Human-Crafted Trust Indicator

Create a subtle, reassuring indicator next to template forms that emphasizes human expertise while acknowledging AI assistance.

**New component:** `HumanCraftedBadge`

```text
+--------------------------------------------------+
| [Users icon] Crafted by legal writing experts    |
|              AI assists, humans ensure quality   |
+--------------------------------------------------+
```

**Placement:**
- Below the progress bar in `LetterGenerator.tsx`
- Subtle, non-intrusive design using muted colors
- Uses `Users` icon from Lucide to represent human team

---

## Technical Details

### New Stripe Prices to Create

```text
Product: Letter PDF Only (prod_TrBeqRtAKr9B1q)
  - New Price: $9.99 (price_NEW_PDF_ONLY)

Product: Letter PDF + Editable (prod_TrBepH46owx3In)
  - New Price: $14.99 (price_NEW_PDF_EDITABLE)

NEW Product: Unlimited Monthly
  - Price: $24.99/month recurring
```

### Edge Function: check-subscription

Checks if user has an active Stripe subscription:
- Called on login and periodically (every 60 seconds)
- Returns `{ subscribed: boolean, subscription_end: string | null }`
- Used to bypass payment for unlimited subscribers

### Edge Function: create-subscription-checkout

Creates a Stripe checkout session for the subscription:
- Requires authenticated user
- Uses `mode: "subscription"`
- Returns checkout URL

### PricingModal Changes

```text
Current:
+-------------------+  +-------------------+
| PDF Only  $5.99   |  | PDF+Edit  $9.99   |
+-------------------+  +-------------------+

New:
+-------------------+  +-------------------+
| PDF Only  $9.99   |  | PDF+Edit $14.99   |
+-------------------+  +-------------------+
         +------------------------+
         | Unlimited $24.99/mo    |
         | Save with unlimited    |
         +------------------------+
```

### Database Migration

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone;
```

---

## Files to Create/Modify Summary

### New Files
- `src/components/letter/HumanCraftedBadge.tsx` - Trust indicator component
- `supabase/functions/check-subscription/index.ts` - Verify subscription
- `supabase/functions/create-subscription-checkout/index.ts` - Create subscription

### Modified Files
- `src/components/letter/PricingModal.tsx` - Add subscription option, update prices
- `src/components/letter/LetterGenerator.tsx` - Add HumanCraftedBadge, subscription bypass
- `src/components/home/Pricing.tsx` - Add subscription tier, update prices
- `src/pages/PricingPage.tsx` - Add subscription tier, update schema
- `src/hooks/useAuth.tsx` - Add subscription checking
- `supabase/functions/create-letter-checkout/index.ts` - Update price IDs
- `supabase/config.toml` - Add new edge function configs

---

## User Flow After Implementation

### Per-Letter Purchase Flow (unchanged)
1. User fills out letter form
2. Clicks "Generate Letter"
3. Sees pricing modal with 3 options ($9.99, $14.99, $24.99/mo)
4. Selects option and pays via Stripe
5. Downloads letter

### Subscription Flow (new)
1. User purchases $24.99/mo subscription
2. On subsequent visits, subscription is detected
3. User fills out letter form
4. Clicks "Generate Letter"
5. Letter is generated immediately (no payment step)
6. User can download unlimited letters

---

## Rollout Sequence

1. Create new Stripe prices (tool calls)
2. Run database migration for subscription columns
3. Create edge functions for subscription management
4. Update frontend components with new prices and subscription option
5. Deploy edge functions
6. Test end-to-end purchase flows
