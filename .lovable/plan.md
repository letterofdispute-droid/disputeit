

# In-App Letter Editor for Letter Of Dispute

## Overview

Replace the current DOCX download option with a built-in TipTap-powered letter editor. Remove the Unlimited Monthly subscription entirely.

## Updated Pricing Structure (2 Tiers Only)

| Tier | Price | What Customer Gets |
|------|-------|-------------------|
| PDF Only | $9.99 | Read-only PDF download |
| PDF + Edit Access | $14.99 | PDF + 30 days in-app editing + export to PDF |
| ~~Unlimited Monthly~~ | ~~$24.99/mo~~ | **REMOVED** |

**Re-edit unlock:** $5.99 to unlock 30 more days of editing after initial period expires.

## What Gets Removed

- Delete `supabase/functions/check-subscription/index.ts`
- Delete `supabase/functions/create-subscription-checkout/index.ts`
- Delete `supabase/functions/customer-portal/index.ts`
- Remove subscription checking from `useAuth.tsx`
- Remove subscription UI from `PricingModal.tsx`, `Pricing.tsx`, `PricingPage.tsx`
- Remove subscription columns from database (or leave unused)

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      PURCHASE FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Completes Form → Chooses Tier → Stripe Payment            │
│                                                                  │
│  PDF Only ($9.99):                                              │
│    └─→ Generate PDF → Store in 'letters' bucket → Download     │
│                                                                  │
│  PDF + Edit ($14.99):                                           │
│    └─→ Generate PDF → Store content in DB with edit_expires_at │
│    └─→ User redirected to /letters/{purchase_id}/edit          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      EDITOR ACCESS FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User visits /letters/{purchase_id}/edit                        │
│                                                                  │
│  ┌─ Check edit_expires_at ────────────────────────────────────┐ │
│  │                                                             │ │
│  │  If edit_expires_at > now():                               │ │
│  │    → Show full editor with save & export                   │ │
│  │    → Display "X days remaining" badge                      │ │
│  │                                                             │ │
│  │  If edit_expires_at <= now():                              │ │
│  │    → Show read-only preview with blur overlay              │ │
│  │    → "Unlock Editing for $5.99" button                     │ │
│  │    → Stripe checkout → extends edit_expires_at by 30 days  │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Changes

### Migration: Add editing access columns to `letter_purchases`

```sql
ALTER TABLE public.letter_purchases
ADD COLUMN IF NOT EXISTS edit_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_edited_content text,
ADD COLUMN IF NOT EXISTS last_edited_at timestamp with time zone;

-- For existing pdf-editable purchases, grant 30-day access from now
UPDATE public.letter_purchases
SET edit_expires_at = NOW() + INTERVAL '30 days'
WHERE purchase_type = 'pdf-editable'
  AND edit_expires_at IS NULL;

-- Add RLS policy for users to update their own letters
CREATE POLICY "Users can update their own letters for editing"
ON public.letter_purchases
FOR UPDATE
USING (auth.uid() = user_id OR email = auth.email())
WITH CHECK (auth.uid() = user_id OR email = auth.email());
```

## New Components

### 1. Letter Editor Page (`src/pages/LetterEditorPage.tsx`)

- Route: `/letters/:purchaseId/edit`
- Fetches purchase data and checks edit access
- Shows countdown timer for editing access
- Displays TipTap editor or locked state

### 2. Letter Editor Component (`src/components/letter/LetterEditor.tsx`)

Adapted from existing `RichTextEditor.tsx`:

- Simplified toolbar (bold, italic, lists)
- Letter-style formatting
- Auto-save every 30 seconds
- Manual save button
- "Export as PDF" button

### 3. Edit Access Badge (`src/components/letter/EditAccessBadge.tsx`)

Shows remaining edit access time:
- Green: "23 days remaining"
- Yellow: "3 days remaining"  
- Red: "Editing locked - Unlock for $5.99"

### 4. Unlock Editing Modal (`src/components/letter/UnlockEditingModal.tsx`)

Shown when edit access has expired:
- Preview of letter (blurred body)
- "Unlock 30 more days of editing for $5.99"
- Stripe checkout integration

## Edge Functions

### New Functions

| Function | Purpose |
|----------|---------|
| `create-edit-unlock-checkout` | Creates $5.99 Stripe checkout for unlocking editing |
| `verify-edit-unlock-purchase` | Verifies payment, extends edit_expires_at by 30 days |
| `export-letter-pdf` | Generates PDF from current edited content |

### Functions to Update

| Function | Changes |
|----------|---------|
| `verify-letter-purchase` | Set edit_expires_at for pdf-editable, skip DOCX |
| `generate-letter-documents` | Remove DOCX generation entirely |

### Functions to Delete

| Function | Reason |
|----------|--------|
| `check-subscription` | No subscription tier |
| `create-subscription-checkout` | No subscription tier |
| `customer-portal` | No subscription tier |

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `src/pages/LetterEditorPage.tsx` | Main editor page with access control |
| `src/components/letter/LetterEditor.tsx` | TipTap editor for letters |
| `src/components/letter/EditAccessBadge.tsx` | Shows remaining edit time |
| `src/components/letter/UnlockEditingModal.tsx` | Payment modal for unlocking |
| `supabase/functions/create-edit-unlock-checkout/index.ts` | Stripe checkout for unlock |
| `supabase/functions/verify-edit-unlock-purchase/index.ts` | Verify unlock payment |
| `supabase/functions/export-letter-pdf/index.ts` | Generate PDF from edited content |

### Files to Modify

| File | Changes |
|------|---------|
| `src/routes.ts` | Add `/letters/:purchaseId/edit` route |
| `src/pages/PurchaseSuccessPage.tsx` | For pdf-editable, show "Edit Letter" CTA |
| `src/components/dashboard/PurchasedLetterCard.tsx` | Replace "Download Word" with "Edit Letter" |
| `src/components/letter/PricingModal.tsx` | Remove subscription option, update copy |
| `src/components/home/Pricing.tsx` | Remove subscription tier |
| `src/pages/PricingPage.tsx` | Remove subscription tier, update schema |
| `src/hooks/useAuth.tsx` | Remove subscription checking logic |
| `supabase/functions/verify-letter-purchase/index.ts` | Set edit_expires_at, skip DOCX |
| `supabase/functions/generate-letter-documents/index.ts` | Remove DOCX generation |
| `supabase/config.toml` | Remove subscription functions, add new ones |

### Files to Delete

| File | Reason |
|------|--------|
| `supabase/functions/check-subscription/index.ts` | No subscription tier |
| `supabase/functions/create-subscription-checkout/index.ts` | No subscription tier |
| `supabase/functions/customer-portal/index.ts` | No subscription tier |

## Stripe Products

### Keep Existing
- PDF Only: $9.99 (`price_1SxZWsROE6uHwbbom1l6Z4fU`)
- PDF + Edit: $14.99 (`price_1SxZWtROE6uHwbboDYtTLOTU`)

### Create New
- Letter Editing Access Unlock: $5.99 (one-time)

### Archive/Ignore
- Unlimited Monthly: $24.99/mo (`price_1SxZWuROE6uHwbbot8KzRRU7`) - no longer used

## User Experience

### Editor Interface

```text
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          [23 days of editing remaining] │
├──────────────────────────────────────────────────────────────┤
│  Refund Request Letter                          [Save Draft] │
├──────────────────────────────────────────────────────────────┤
│  [B] [I] [List] [Numbered]              [Undo] [Redo]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Dear Customer Service,                                      │
│                                                              │
│  I am writing to formally request a refund for my recent    │
│  purchase of [Product Name] on [Date].                      │
│                                                              │
│  The issue I experienced was...                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  847 words  •  Auto-saved 2 minutes ago          [Export PDF]│
└──────────────────────────────────────────────────────────────┘
```

### Expired Access State

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  🔒 Editing Access Expired                          │   │
│   │                                                      │   │
│   │  Unlock 30 more days of editing                     │   │
│   │                                                      │   │
│   │  [$5.99 - Unlock Editing]                           │   │
│   │                                                      │   │
│   │  [Download Last Saved PDF]                          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   [Blurred letter content preview behind overlay]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Sequence

1. Remove subscription tier (code cleanup)
2. Database migration (add edit tracking columns)
3. Create $5.99 Stripe product
4. Build LetterEditor component (adapt TipTap)
5. Build LetterEditorPage with access control
6. Create edge functions (unlock checkout, verify, export)
7. Update verify-letter-purchase (set edit_expires_at)
8. Update generate-letter-documents (remove DOCX)
9. Update dashboard (Edit Letter button)
10. Update success page (Edit Letter CTA)
11. Update pricing UI (remove subscription, clarify copy)
12. Delete unused subscription edge functions

