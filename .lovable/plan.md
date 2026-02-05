

# Update Branding and Pricing Documentation for Letter Of Dispute

## Overview

Fix branding inconsistencies (change "DisputeLetters" to "Letter of Dispute") and update all pricing-related documentation to reflect the new two-tier model with in-app editing.

---

## 1. Branding Updates

### Files Affected

| File | Current | Should Be |
|------|---------|-----------|
| `src/pages/HowItWorksPage.tsx` | "DisputeLetters" | "Letter of Dispute" |

### Specific Changes

**HowItWorksPage.tsx:**
- Line 168: Schema description mentions "DisputeLetters"
- Line 221-222: SEO title/description say "DisputeLetters"
- Line 239: H1 heading says "How DisputeLetters Works"

---

## 2. Pricing Documentation Updates

### HowItWorksPage.tsx - FAQs (Lines 136-161)

| FAQ | Current Answer | Updated Answer |
|-----|---------------|----------------|
| "Can I customize the letter after generating it?" | "PDF + Editable ($9.99) includes a Word document" | "PDF + Edit Access ($14.99) includes 30 days of in-app editing" |
| "What if my situation isn't covered by a template?" | "PDF + Editable option lets you customize" | "PDF + Edit Access option gives you 30 days to edit in our online editor" |

### HowItWorksPage.tsx - Step 03 (Lines 54-63)

| Current | Updated |
|---------|---------|
| "download as PDF or editable Word document" | "download as PDF, or edit in our online editor with the Edit Access option" |
| Tips mention "Word format lets you make additional edits" | "Edit Access gives you 30 days to customize in our online editor" |

### HowItWorksPage.tsx - HowTo Schema (Lines 163-200)

| Field | Current | Updated |
|-------|---------|---------|
| estimatedCost.value | "5.99" | "9.99" |
| description | "DisputeLetters" | "Letter of Dispute" |
| Step 3 text | "download as PDF or editable Word document" | "download as PDF, or use our in-app editor" |

---

## 3. PricingPage.tsx Verification

The PricingPage.tsx already has correct pricing ($9.99 / $14.99) and mentions in-app editing. Minor branding check needed.

---

## 4. Editor Branding (Subtle)

Add subtle branding to the LetterEditorPage:
- Small "Letter of Dispute" watermark or badge in the editor footer
- Keeps brand presence without being intrusive

---

## Summary of Changes

| File | Type of Change |
|------|---------------|
| `src/pages/HowItWorksPage.tsx` | Brand name updates, pricing updates, FAQ updates, step descriptions, schema fixes |
| `src/pages/LetterEditorPage.tsx` | Add subtle branding badge |

---

## Technical Details

### HowItWorksPage.tsx Changes

1. **SEO Head (lines 220-224)**
```tsx
// Change from:
title="How It Works - Create Dispute Letters in Minutes | DisputeLetters"
description="Learn how DisputeLetters helps you..."

// To:
title="How It Works - Create Dispute Letters in Minutes | Letter of Dispute"
description="Learn how Letter of Dispute helps you..."
```

2. **Hero H1 (line 239)**
```tsx
// Change from:
How DisputeLetters Works

// To:
How Letter of Dispute Works
```

3. **Step 03 description and tips (lines 54-63)**
```tsx
// Update description:
"Your personalized dispute letter is created instantly. Preview it, make any final adjustments, then download as PDF or edit online with 30-day access."

// Update tips:
- 'Review the letter preview before purchasing',
- 'PDF is ready to send immediately',
- 'Edit Access gives you 30 days to customize online',
```

4. **FAQ updates (lines 147-151)**
```tsx
// "Can I customize the letter after generating it?"
answer: 'Yes! The PDF + Edit Access ($14.99) option includes 30 days of in-app editing. Make changes anytime, then export to PDF when you\'re ready to send.'

// "What if my situation isn't covered by a template?"
answer: '...our PDF + Edit Access option gives you 30 days to customize any template in our online editor.'
```

5. **HowTo Schema (lines 163-200)**
```tsx
estimatedCost: {
  "@type": "MonetaryAmount",
  "currency": "USD",
  "value": "9.99"  // Updated from 5.99
}
// Update description: "Letter of Dispute"
// Update step 3 text
```

### LetterEditorPage.tsx - Subtle Branding

Add a small branded footer inside the editor card:
```tsx
// In the editor footer area, add:
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <img src="/ld-logo-icon.svg" alt="" className="h-4 w-4 opacity-50" />
  <span>Letter of Dispute</span>
</div>
```

---

## Edge Functions Status

All edge functions are now deployed and ready:
- `export-letter-pdf` - Deployed
- `create-edit-unlock-checkout` - Deployed
- `verify-edit-unlock-purchase` - Deployed
- `create-letter-checkout` - Already deployed
- `verify-letter-purchase` - Already deployed

