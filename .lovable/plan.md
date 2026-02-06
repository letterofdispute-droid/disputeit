
# Fix PDF Generation Boot Error + Mobile Button Layout

## Overview

Two critical issues need to be resolved:
1. The PDF edge function fails to start due to missing exports in `pdfHelpers.ts`
2. Mobile button layout uses invalid Tailwind breakpoint

---

## Issue 1: PDF Generation Boot Error

### Root Cause

From the edge function logs:
```
worker boot error: The requested module '../_shared/pdfHelpers.ts' does not provide an export named 'LINE_HEIGHT'
```

The `generate-letter-documents/index.ts` imports these constants on lines 15-18:
- `PAGE_WIDTH`
- `PAGE_HEIGHT`
- `MARGIN_TOP`
- `LINE_HEIGHT`

However, in `pdfHelpers.ts`, these constants are used internally but **never exported**. The file defines colors and functions with `export` but the page dimension and font size constants are missing their export statements.

### Solution

Add `export` keyword to all constants used internally that are also imported by other edge functions.

**File: `supabase/functions/_shared/pdfHelpers.ts`**

Add these exported constants after the color exports (around line 16):

```text
// Page dimensions (US Letter)
export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;

// Margins (1 inch = 72 points)
export const MARGIN_TOP = 72;
export const MARGIN_BOTTOM = 72;
export const MARGIN_LEFT = 72;
export const MARGIN_RIGHT = 72;

// Content area
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Font sizes
export const FONT_SIZE_BODY = 11;
export const FONT_SIZE_SUBJECT = 12;
export const FONT_SIZE_FOOTER = 9;

// Line spacing (1.6x for readability)
export const LINE_HEIGHT = FONT_SIZE_BODY * 1.6;
```

---

## Issue 2: Mobile Button Layout

### Root Cause

The code uses `xs:flex-row` and `xs:items-center` on line 160 of `PurchasedLetterCard.tsx`:
```tsx
<div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
```

However, `xs:` is **not a standard Tailwind breakpoint**. Default Tailwind breakpoints start at `sm` (640px). The `xs:` prefix is silently ignored, so the buttons stack vertically always instead of switching to horizontal on small screens.

### Solution

Replace `xs:` with `sm:` for consistent behavior, or simply use different layout approach that works without the invalid breakpoint.

**File: `src/components/dashboard/PurchasedLetterCard.tsx`**

Change line 160:
```text
Before: flex flex-col xs:flex-row items-stretch xs:items-center gap-2
After:  flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-2
```

Or use `sm:` for standard breakpoint:
```text
After: flex flex-col sm:flex-row items-stretch sm:items-center gap-2
```

Also update the button classes on lines 171 and 188:
```text
Before: flex-1 xs:flex-none
After:  flex-1 sm:flex-none
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/_shared/pdfHelpers.ts` | Add missing `export` statements for page constants (PAGE_WIDTH, PAGE_HEIGHT, MARGIN_*, LINE_HEIGHT, FONT_SIZE_*, CONTENT_WIDTH) |
| `src/components/dashboard/PurchasedLetterCard.tsx` | Replace invalid `xs:` breakpoints with valid `sm:` or `min-[400px]:` breakpoints |

---

## Technical Details

### Constants to Export in pdfHelpers.ts

These constants exist but are not exported:
- PAGE_WIDTH (612) - US Letter width in points
- PAGE_HEIGHT (792) - US Letter height in points
- MARGIN_TOP, MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_RIGHT (72) - 1 inch margins
- CONTENT_WIDTH - calculated content area
- FONT_SIZE_BODY (11), FONT_SIZE_SUBJECT (12), FONT_SIZE_FOOTER (9)
- LINE_HEIGHT - based on FONT_SIZE_BODY * 1.6

### Edge Functions to Redeploy

After fixing `pdfHelpers.ts`, the following functions need to be deployed:
- `generate-letter-documents` - uses the missing exports
- `regenerate-letter-urls` - calls generate-letter-documents
- `export-letter-pdf` - also uses pdfHelpers

---

## After Implementation

Once deployed, users will be able to:
1. Download PDFs from their dashboard successfully
2. See properly aligned buttons on mobile devices
3. Get the professional unbranded PDF template with all new formatting
