

# Show Template Name and Better Description on Stripe Checkout

## Problem
The Stripe checkout page currently shows generic product names like "Letter PDF Only" because it uses pre-created Stripe Price IDs, which have fixed product names attached to them.

## Solution
Override the product name and description at checkout time using Stripe's `price_data` inline pricing instead of referencing pre-created Price IDs. This lets us dynamically set the product name and description per checkout session while keeping the same amounts.

## Technical Details

### File: `supabase/functions/create-letter-checkout/index.ts`

Replace the `line_items` section that references static `price` IDs with `price_data` that includes:
- A dynamic **product name** incorporating the template name (e.g., "Double Billing Complaint - PDF + Edit Access")
- A helpful **description** (e.g., "Professional dispute letter with legal-safe phrasing, ready to send")
- The same amounts ($9.99 / $14.99) and currency (USD)

**Before:**
```typescript
line_items: [
  {
    price: PRICE_IDS[purchaseType],
    quantity: 1,
  },
],
```

**After:**
```typescript
line_items: [
  {
    price_data: {
      currency: "usd",
      unit_amount: AMOUNTS[purchaseType],
      product_data: {
        name: `${templateName} — ${purchaseType === "pdf-editable" ? "PDF + Edit Access" : "PDF Only"}`,
        description: purchaseType === "pdf-editable"
          ? "Professional dispute letter with 30 days of in-app editing and unlimited PDF exports"
          : "Professional dispute letter as a ready-to-send PDF download",
      },
    },
    quantity: 1,
  },
],
```

This means each checkout session creates an inline product with the template's actual name visible to the customer. The `PRICE_IDS` constant becomes unused and can be removed.

### Impact
- Customers will see e.g. **"Double Billing Complaint -- PDF + Edit Access"** instead of generic "Letter PDF Only"
- No database or frontend changes needed
- Only the edge function is updated

