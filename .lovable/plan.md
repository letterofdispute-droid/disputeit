
# Sticky Evidence Checklist & Remove Template Counts

## Overview
This plan addresses two changes:
1. **Make the Evidence Checklist sticky on desktop** - so it stays visible while scrolling through the form
2. **Remove template count numbers from the UI** - eliminating "X templates" text across the site

---

## Changes Required

### 1. Make Evidence Checklist Sticky on Desktop

**File: `src/components/letter/LetterGenerator.tsx`**

The sidebar container (lines 337-363) needs sticky positioning so it remains visible as users scroll through long forms.

**Current code:**
```tsx
<div className="lg:col-span-1 space-y-4">
```

**Updated code:**
```tsx
<div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 lg:self-start">
```

This adds:
- `lg:sticky` - enables sticky positioning on desktop (lg breakpoint)
- `lg:top-24` - offsets from top to account for the header (~96px)
- `lg:self-start` - prevents the sticky element from stretching to fill the grid cell

---

### 2. Remove Template Count Numbers

Remove "X templates" text from all UI locations:

#### File: `src/components/layout/MegaMenu.tsx`
- **Line 104**: Remove `{category.templateCount} templates` from popular categories
- **Line 129**: Remove `{category.templateCount} templates` from all categories
- Replace with the category's short description instead for better UX

#### File: `src/components/home/LetterCategories.tsx`
- **Lines 17-19**: Remove the sentence with total template counts
- **Lines 54-56**: Remove `{category.templateCount} letter templates` text

#### File: `src/pages/AllTemplatesPage.tsx`
- **Lines 143-145**: Remove the Badge showing `{category.templateCount}`

#### File: `src/pages/CategoryPage.tsx`
- **Line 200**: Remove "Browse {templates.length}" from the hero description

#### File: `src/pages/SubcategoryPage.tsx`
- **Line 188**: Remove "Browse {subcategoryTemplates.length}" from the hero description

#### File: `src/components/category/CategorySearch.tsx`
- **Lines 45-48**: Remove "Showing X of Y templates" result count display

#### File: `src/components/category/SubcategoryFilter.tsx`
- **Line 33**: Change `All ({totalCount})` to just `All`
- **Line 52**: Change `{sub.name} ({count})` to just `{sub.name}`

#### File: `scripts/build-static.mjs` (SEO static pages)
- **Line 454**: Remove `(${group.templates.length} templates)` from subcategory headers
- **Line 462**: Remove `View all ${group.templates.length} templates` link text
- **Line 518**: Remove `${categoryTemplates.length} templates available` text

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/letter/LetterGenerator.tsx` | Add sticky positioning to sidebar |
| `src/components/layout/MegaMenu.tsx` | Remove template counts, add descriptions |
| `src/components/home/LetterCategories.tsx` | Remove template count text |
| `src/pages/AllTemplatesPage.tsx` | Remove count badge |
| `src/pages/CategoryPage.tsx` | Simplify hero text |
| `src/pages/SubcategoryPage.tsx` | Simplify hero text |
| `src/components/category/CategorySearch.tsx` | Remove result count display |
| `src/components/category/SubcategoryFilter.tsx` | Remove counts from filter chips |
| `scripts/build-static.mjs` | Remove counts from static SEO pages |

---

## Result

After implementation:
- The Evidence Checklist and Letter Strength meter will remain visible on desktop as users scroll through the form fields
- No template counts will be displayed anywhere in the UI, providing a cleaner experience without specific numbers
