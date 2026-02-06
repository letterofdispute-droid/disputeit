

# Remove Branding & Apply Professional Legal Letter Best Practices

## Overview

The current PDF template contains branding that needs to be removed to make it neutral and professional. Additionally, I'll apply best practices from professional legal correspondence to ensure the template looks like what a lawyer would produce.

---

## Current Branding to Remove

The following branded elements exist in `supabase/functions/_shared/pdfHelpers.ts`:

| Element | Location | Current Value |
|---------|----------|---------------|
| Header brand name | Line 35, 129 | "Letter of Dispute" |
| Website in footer | Line 36, 381 | "letterofdispute.com" |
| Reference ID prefix | Line 547 | "LD-" |
| Continuation page header | Line 462 | "Letter of Dispute" (light gray) |
| Brand blue color | Line 11 | Used for header accent line |

---

## Changes to Make Template Unbranded

### 1. Remove Header Branding (drawLetterhead function)
- Remove the "Letter of Dispute" text from the top left
- Keep the reference ID on the right (neutral identifier)
- Keep the accent line but use a neutral color (dark gray instead of brand blue)

### 2. Remove Footer Website (drawFooter function)  
- Remove "letterofdispute.com" from footer
- Keep page numbering (centered)
- Keep reference ID (right side)
- Keep the disclaimer (it's neutral and professional)

### 3. Neutralize Reference ID
- Change prefix from "LD-" to "REF-" (generic)

### 4. Remove Continuation Page Branding
- Remove "Letter of Dispute" text from continuation pages
- Replace with just "CONTINUED" or leave blank

---

## Professional Legal Letter Best Practices Applied

Based on research from Georgetown Law, CUNY Law, and standard attorney correspondence formats, professional legal letters should include:

### Structure (Already Implemented)
- Date (right-aligned) - present
- Delivery method notation (e.g., "VIA CERTIFIED MAIL") - present
- Recipient address block - present
- Subject line with "Re:" prefix - present
- Body with proper paragraph spacing - present
- Closing ("Sincerely,") with signature space - present

### Improvements to Add
1. **Salutation**: Add "Dear Sir/Madam:" or "To Whom It May Concern:" after recipient block (currently missing)
2. **Font**: Times New Roman 11-12pt is correct (already using Times Roman 11pt)
3. **Margins**: 1-inch margins are standard (already using 72pt = 1 inch)
4. **Line Spacing**: 1.5-1.6x is professional (already using 1.6x)

### Footer Disclaimer (Keep)
The current disclaimer is appropriate: "This document is for dispute resolution purposes only and does not constitute legal advice."

---

## Technical Changes

### File: `supabase/functions/_shared/pdfHelpers.ts`

**1. Remove brand constants:**
```typescript
// Remove lines 35-36:
// export const BRAND_NAME = "Letter of Dispute";
// export const BRAND_WEBSITE = "letterofdispute.com";
```

**2. Update drawLetterhead function (lines 121-163):**
- Remove the brand name text drawing
- Change accent line color from BRAND_BLUE to DARK_GRAY
- Keep reference ID display

**3. Update drawFooter function (lines 352-412):**
- Remove the website text (lines 380-387)
- Keep page number centered
- Keep reference ID on right
- Keep disclaimer

**4. Update generateReferenceId function (line 545-552):**
- Change prefix from "LD-" to "REF-"

**5. Update drawBodyContent continuation pages (lines 461-469):**
- Remove or replace the brand name with neutral text or nothing

**6. Add salutation drawing:**
- Add a new function or incorporate "Dear Sir/Madam:" after the recipient block

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Header | "Letter of Dispute" in blue | Just accent line (dark gray) |
| Header accent | Blue line | Dark gray line |
| Footer left | "letterofdispute.com" | Empty (just pagination + ref) |
| Reference ID | "LD-XXXXXX" | "REF-XXXXXX" |
| Continuation header | "Letter of Dispute" | Nothing or page number only |
| Salutation | Missing | "Dear Sir/Madam:" added |

---

## Result

The PDF will look like a professional legal correspondence that any attorney might produce - neutral, formal, and properly formatted without any third-party branding that could raise questions about the document's origin or legitimacy.

