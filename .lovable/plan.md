

# Bug: Broken Template Links in RelatedTemplatesCTA + Audit of All Template URL Construction

## What's Wrong

**`src/components/article/RelatedTemplatesCTA.tsx`** has a confirmed bug on lines 45 and 71. It uses `template.category` (the human-readable name, e.g., `"Consumer Rights"`) directly in the URL path instead of converting it to the category ID (`"consumer-rights"`).

This means every "Related Templates" CTA displayed on article pages produces broken links like:
```
/templates/Consumer Rights/general/refund       ← BROKEN (spaces, wrong format)
```
Instead of:
```
/templates/consumer-rights/general/refund       ← CORRECT
```

This affects all ~6,500 published articles that have `related_templates` set.

**All other files are correct.** `TemplateCard.tsx`, `GlobalSearch.tsx`, `RelatedTemplates.tsx`, `LegacyTemplateRedirect.tsx` all use `getCategoryIdFromName()` properly. The tools pages (`EscalationFlowchart`, `QuizResult`, etc.) use `category.id` directly which is already URL-friendly.

## Fix (1 file)

### `src/components/article/RelatedTemplatesCTA.tsx`

1. Import `getCategoryIdFromName` from `@/data/allTemplates`
2. Line 42: Replace `getCategoryById(template.category)` with `getCategoryById(getCategoryIdFromName(template.category))` so the badge actually resolves
3. Line 45: Change `template.category` to `getCategoryIdFromName(template.category)` in the URL
4. Line 71: Same fix for the single-template CTA button URL

This is a 3-line fix in one file. No other components or tools have this issue.

