
# Fix Letter Generation Flow: Download Button, Evidence Images, and Email Notification

## Issues Identified

After analyzing the codebase, I've found **three separate issues** that are all related to the letter generation and purchase flow:

### Issue 1: Download PDF Button Disabled (Grayed Out)

**Root Cause:** The `pdfUrl` is not being returned properly from the verification/generation flow.

Looking at the data flow:
1. `verify-letter-purchase/index.ts` (lines 98-129) calls `generate-letter-documents` and passes the result
2. `generate-letter-documents/index.ts` generates the PDF and returns `pdfUrl`
3. However, it's storing a **signed URL** in the database (line 282), which expires in 7 days

The issue is that when the **credit redemption flow** is used (`redeem-credit/index.ts`), the function calls `generate-letter-documents` but:
- It's missing the `templateName` parameter (line 130-133)
- The PurchaseSuccessPage tries to fetch and regenerate a signed URL but the original path format is a signed URL, not a storage path

In `PurchaseSuccessPage.tsx` (lines 60-66), the code tries to create a signed URL from `pdf_url`:
```typescript
if (pdfUrl && pdfUrl.startsWith('letters/')) {
  const { data: signedData } = await supabase.storage
    .from('letters')
    .createSignedUrl(pdfUrl.replace('letters/', ''), 3600);
```

But `generate-letter-documents` stores the **full signed URL** (not just the path) in the `pdf_url` column (line 282). So the check `pdfUrl.startsWith('letters/')` fails, and the button stays disabled because the old signed URL has likely expired.

**Fix:** Store only the storage path (not the full signed URL) in the database, then generate fresh signed URLs when needed.

---

### Issue 2: Evidence Photos Not Included in PDF

**Root Cause:** Evidence photos are **never passed** from the frontend to the backend.

The flow should be:
1. User uploads photos via `EvidenceUploader` component (stored in `useEvidenceUpload` hook)
2. Before purchase, photos should be uploaded to storage and paths collected
3. The `evidencePhotoPaths` should be passed to `create-letter-checkout` and then to `generate-letter-documents`

**Current problem:**
- `PricingModal.tsx` (line 100-107) calls `create-letter-checkout` but does NOT pass `evidencePhotoPaths`
- `create-letter-checkout/index.ts` (lines 32-37) doesn't accept evidence photos
- `verify-letter-purchase/index.ts` (lines 109-114) doesn't pass evidence photos to `generate-letter-documents`

**Fix:** 
1. Pass evidence photos from `LetterGenerator` → `PricingModal` → `create-letter-checkout`
2. Store evidence paths in `letter_purchases` table
3. Pass them through `verify-letter-purchase` → `generate-letter-documents`

---

### Issue 3: No Email Notification

**Root Cause:** The email is only sent in the **Stripe payment flow**, not in the credit redemption flow.

Looking at:
- `verify-letter-purchase/index.ts` (lines 131-162): Sends email after Stripe verification
- `redeem-credit/index.ts`: Does NOT call `send-purchase-email` at all

Also, the email sending depends on `customerEmail` which comes from Stripe's checkout session. For credit redemptions, we already have the user's email but don't use it to send an email.

**Fix:** Add email sending to the credit redemption flow.

---

## Implementation Plan

### Step 1: Fix Database Schema - Add Evidence Column

Add a column to store evidence photo paths:

```sql
ALTER TABLE letter_purchases 
ADD COLUMN IF NOT EXISTS evidence_photos JSONB DEFAULT '[]';
```

### Step 2: Update `create-letter-checkout` to Accept Evidence Photos

**File:** `supabase/functions/create-letter-checkout/index.ts`

- Accept `evidencePhotoPaths` in request body
- Store in the `letter_purchases` record

### Step 3: Update `verify-letter-purchase` to Pass Evidence Photos

**File:** `supabase/functions/verify-letter-purchase/index.ts`

- Retrieve `evidence_photos` from the purchase record
- Pass to `generate-letter-documents`

### Step 4: Update `generate-letter-documents` to Store Path, Not Signed URL

**File:** `supabase/functions/generate-letter-documents/index.ts`

- Store the storage path (e.g., `purchaseId/letter.pdf`) instead of the full signed URL
- This allows generating fresh signed URLs when needed

### Step 5: Update `PurchaseSuccessPage` to Handle URL Generation

**File:** `src/pages/PurchaseSuccessPage.tsx`

- Generate signed URL from storage path for both flows
- Handle the case where a full URL is already stored (backwards compatibility)

### Step 6: Update `redeem-credit` to Send Email

**File:** `supabase/functions/redeem-credit/index.ts`

- Pass `templateName` to `generate-letter-documents`
- Add email sending after successful redemption

### Step 7: Update Frontend to Pass Evidence Photos

**Files:**
- `src/components/letter/LetterGenerator.tsx` - Pass evidence to PricingModal
- `src/components/letter/PricingModal.tsx` - Accept and pass evidence to checkout

---

## File Changes Summary

| File | Changes |
|------|---------|
| Database migration | Add `evidence_photos` JSONB column |
| `supabase/functions/create-letter-checkout/index.ts` | Accept and store evidence photos |
| `supabase/functions/verify-letter-purchase/index.ts` | Pass evidence photos to document generation |
| `supabase/functions/generate-letter-documents/index.ts` | Store path instead of signed URL |
| `supabase/functions/redeem-credit/index.ts` | Pass templateName, add email sending |
| `src/pages/PurchaseSuccessPage.tsx` | Improve signed URL generation |
| `src/components/letter/LetterGenerator.tsx` | Pass evidence photos to PricingModal |
| `src/components/letter/PricingModal.tsx` | Accept evidence photos and upload before checkout |

---

## Technical Notes

### Evidence Photo Flow (After Fix)

```text
User uploads photos (EvidenceUploader)
         ↓
Photos stored in useEvidenceUpload state
         ↓
User clicks "Generate Letter" → Pricing Modal opens
         ↓
User clicks "Buy" → uploadAllPhotos() called → returns storage paths
         ↓
create-letter-checkout called with evidencePhotoPaths
         ↓
Paths stored in letter_purchases.evidence_photos
         ↓
After payment → verify-letter-purchase retrieves evidence_photos
         ↓
generate-letter-documents embeds photos in PDF
```

### PDF URL Storage (After Fix)

```text
Before: pdf_url = "https://supabase.../storage/v1/...?token=..."  (expires!)
After:  pdf_url = "purchaseId/letter.pdf"  (storage path)
```

Fresh signed URLs are generated on-demand when the user views or downloads.
