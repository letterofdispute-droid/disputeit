

# Fix Category Tier Settings Not Reflecting on Coverage Page

## Problem

Two bugs stem from the same root cause: a **category ID mismatch** between the template data and the tier settings system.

### Root Cause

Templates store their category as a **display name** (e.g., `"Refunds & Purchases"`, `"Damaged Goods"`), but the tier settings and `templateCategories` registry use **slug IDs** (e.g., `"refunds"`, `"damaged-goods"`).

In `TemplateCoverageMap.tsx`, the category grouping code does:
```text
const categoryId = template.category;  // "Refunds & Purchases" (display name!)
```

This means `getTierForCategory("Refunds & Purchases")` finds no match in the tier settings (which stores `"refunds"`) and falls back to `"medium"` every time -- regardless of what you set in Settings.

Similarly, `templateCategories.find(c => c.id === categoryId)` fails because `templateCategories` uses IDs like `"refunds"`, not `"Refunds & Purchases"`. This causes some categories to display incorrectly or be mismatched.

### Bug 1: Tier changes do not reflect

When you change "Contractors" to "High" in Settings, it saves `{ contractors: "high" }`. But the coverage page looks up the tier using `getTierForCategory("Contractors")` (the display name), which has no match, so it always returns `"medium"`.

### Bug 2: Missing or mismatched categories

Because the `templateCategories.find()` lookup fails, some categories may show raw display names instead of proper entries, and category-specific features (like tier badges) break.

## Solution

Update `TemplateCoverageMap.tsx` to convert the template display-name category into the proper slug ID using the existing `getCategoryIdFromName()` utility from `allTemplates.ts`.

### Changes

**File: `src/components/admin/seo/TemplateCoverageMap.tsx`**

1. Import `getCategoryIdFromName` from `@/data/allTemplates`
2. In the `categoryGroups` memo, convert `template.category` (display name) to the proper slug ID:

```text
Before:  const categoryId = template.category;
After:   const categoryId = getCategoryIdFromName(template.category);
```

This single change fixes both bugs because:
- `getTierForCategory("contractors")` now correctly matches the saved tier setting
- `templateCategories.find(c => c.id === "contractors")` now correctly finds the category entry for name, icon, etc.

No other files need changes. The Settings tab (`CategoryTierSettings.tsx`) already iterates `templateCategories` directly using correct IDs, so it works fine -- the bug is only in how the Coverage tab maps template data to category IDs.
