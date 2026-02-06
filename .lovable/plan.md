

# Fix PDF Template + Mobile Button Layout

## Overview

Two issues need to be addressed:
1. The downloaded PDF still uses the old unstyled template because the cached file is being served instead of regenerating with the new professional template
2. Dashboard buttons overflow on mobile screens

---

## Issue 1: PDF Not Using New Template

### Root Cause

The `regenerate-letter-urls` Edge Function checks if `letter.pdf` exists in storage (line 62). If it exists, it returns the cached signed URL. Since the old PDF was generated before the professional template was created, users are getting the old unstyled PDF.

### Solution

Force regeneration by:
1. Deleting the old cached PDF before generating new one
2. OR always regenerate the PDF to ensure latest template is used

**Recommended Approach**: Modify `regenerate-letter-urls` to always call `generate-letter-documents` (which uses the professional template) instead of just returning cached URLs.

### File Changes

**supabase/functions/regenerate-letter-urls/index.ts**:
- Remove the "check if PDF exists" optimization
- Always call `generate-letter-documents` to ensure fresh generation with the professional template
- This guarantees users always get the professionally formatted PDF

```text
Before:
Line 60-106 - Checks if PDF exists, only regenerates if missing

After:
- Skip the file existence check
- Always call generate-letter-documents
- Return the freshly generated professional PDF URL
```

---

## Issue 2: Mobile Button Overflow

### Root Cause

Looking at the screenshot and code:
- `PurchasedLetterCard.tsx` lines 105-136 (featured card) and 162-195 (regular card)
- Buttons use `flex-row` with `gap-3` but no wrapping or size constraints
- On small mobile screens, the two buttons ("Download PDF" + "Edit Letter") exceed container width

### Solution

Make buttons responsive:
1. Stack buttons vertically on small screens using `flex-col` at base, `flex-row` at larger breakpoints
2. Make buttons full width on mobile
3. Use smaller button sizes on mobile

### File Changes

**src/components/dashboard/PurchasedLetterCard.tsx**:

For the featured card (lines 105-136):
```text
Before:
<div className="flex items-center gap-3">

After:
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
```

Also adjust button classes:
- Add `w-full sm:w-auto` to buttons for full-width on mobile
- Use `size="default"` instead of `size="lg"` on mobile

For the regular card (lines 162-195):
```text
Before:
<div className="flex items-center gap-2 sm:gap-3">

After:
<div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/regenerate-letter-urls/index.ts` | Always regenerate PDF with professional template |
| `src/components/dashboard/PurchasedLetterCard.tsx` | Fix button layout to stack on mobile |

---

## Technical Details

### Edge Function Change

The modified `regenerate-letter-urls` will:
1. Verify user access to purchase (unchanged)
2. Always call `generate-letter-documents` to create a fresh PDF
3. Return the new signed URL

This ensures:
- The professional template (letterhead, branded footer, Times New Roman, etc.) is always applied
- Any edits made in the TipTap editor are reflected in downloaded PDF
- No stale cached PDFs are served

### Mobile Button Layout

The responsive approach:
- `flex-col` on mobile (stack vertically)
- `sm:flex-row` on larger screens (side by side)
- `w-full sm:w-auto` on buttons (full width mobile, auto on larger)
- Consistent gap spacing

This matches the pattern already used elsewhere in the component (line 87 for the info section) and ensures buttons never overflow the container.

