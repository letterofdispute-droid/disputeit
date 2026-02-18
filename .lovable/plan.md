

# Fix: Coverage Map Counting Keyword-Based Plans as Template Plans

## Problem

The Template Coverage Map shows "675 of 547 templates" and a "Create 675 Missing Pillars" button because:

1. The `content_plans` table has 675 rows -- 547 for actual templates + 128 for keyword-based content plans.
2. The Coverage Map uses `plans?.length` (675) without filtering out keyword-based plans, unlike `CoverageStats` and `GapAnalysis` which already filter correctly.
3. The "Missing Pillars" count queries ALL `content_plans` rows (675) minus pillar queue items (0) = 675, which is wildly wrong.

## Root Cause

The `CoverageStats` component already has the correct pattern (line 29-31):
```typescript
const templateSlugs = new Set(allTemplates.map(t => t.slug));
const templatePlans = plans?.filter(p => templateSlugs.has(p.template_slug)) || [];
```

But the `TemplateCoverageMap` component never adopted this filter.

## Fix: `src/components/admin/seo/TemplateCoverageMap.tsx`

### Change 1: Filter plans to template-only throughout the component

Add a `templatePlans` filtered list (same pattern as CoverageStats) and use it in place of raw `plans` everywhere:

- **Header subtitle** (line 385): Change `plans?.length` to `templatePlans.length`
- **"Create Missing Plans" button condition** (line 389): Use `templatePlans.length < allTemplates.length`
- **"Create Missing Plans" button label** (line 399): Use `allTemplates.length - templatePlans.length`
- **`getPlanForTemplate`** (line 283-284): Already searches `plans` by slug match, so it naturally filters -- no change needed here.

### Change 2: Fix `missingPillarCount` query (lines 108-120)

The query must only count template-based plans, not keyword plans. Two options:

**Option A (chosen -- server-side filter):** Join `content_plans` against the known template slugs. Since template slugs are client-side data, the simplest approach is to count pillar queue items that have a matching `plan_id` from only template-based plans.

Actually, the cleanest fix: change the `missingPillarCount` to be computed client-side using `templatePlans` and remove the separate query:

```typescript
const missingPillarCount = useMemo(() => {
  // Will be recalculated once pillar count query returns
  // For now, this counts template plans that lack a pillar in the queue
  // But since pillar count comes from a query, we keep the query approach
  // but filter to template plans only
  return templatePlans.length - (pillarCount || 0);
}, [templatePlans, pillarCount]);
```

Better approach: Keep the pillar count query but compute missing as `templatePlans.length - pillarQueueCount`. The pillar queue query stays as-is (counting `article_type = 'pillar'` items), and we just subtract from the filtered template plan count instead of from all plans.

### Change 3: Fix "Create Missing Plans" mutation (lines 183-226)

The `createMissingPlansMutation` fetches all existing plan slugs and compares against `allTemplates`. This is actually already correct -- it finds templates NOT in plans. But if all 547 templates already have plans, the button shouldn't show. The button visibility depends on Change 1 being applied.

## Summary of Changes

**File: `src/components/admin/seo/TemplateCoverageMap.tsx`**

1. Add a `templatePlans` memo that filters `plans` to only slugs in `allTemplates`
2. Replace all `plans?.length` / `plans.length` references with `templatePlans.length` in the header and button areas
3. Compute `missingPillarCount` as `templatePlans.length - pillarQueueCount` instead of `totalPlans - pillarQueueCount`

## Expected Result

- Header shows "547 of 547 templates with content plans" (100%)
- "Create Missing Plans" button disappears (all templates are planned)
- "Create Missing Pillars" button shows correct count based on template plans only, not keyword plans
