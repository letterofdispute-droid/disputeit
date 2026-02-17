

# Improve Queue UI: Add Category Column + Guided Next Steps

## Problems

1. **No category column in queue table** -- you can't see which blog category each article belongs to, so you can't verify correctness at a glance.
2. **No guidance after planning** -- after "Plan All Keywords" creates 184 queued items, you land on the Queue tab with no clear indication of what to do next.
3. **"Generate" button is unclear** -- it says "Generate (0)" because nothing is selected, but selecting 184 items one by one is impractical.

## Data Check

I verified the database: all 184 queued items have **correct** category assignments via their content_plans (contractors: 28, insurance: 40, travel: 29, healthcare: 29, vehicle: 27, housing: 26, employment: 5). The categories are fine -- the issue is just that you can't see them.

## Changes

### 1. Add Category column to QueueTable (`src/components/admin/seo/queue/QueueTable.tsx`)

- Add a "Category" column between "Type" and "Template"
- Display the `content_plans.category_id` as a capitalized label (e.g., "Contractors", "Insurance")
- Color-code with a subtle badge so categories are visually scannable

### 2. Add "Next Steps" action banner to ContentQueue (`src/components/admin/seo/ContentQueue.tsx`)

When there are queued items and nothing is currently generating, show a prominent banner:

```text
+----------------------------------------------------------+
| 184 articles ready to generate                           |
|                                                           |
| [Select All Queued]  [Generate All 184]                  |
+----------------------------------------------------------+
```

- "Select All Queued" selects all items with status=queued
- "Generate All" fires bulk generation for all queued items directly (no need to manually select)
- Banner disappears when generation starts or queue is empty

### 3. Add "Generate All Queued" button to QueueActions (`src/components/admin/seo/queue/QueueActions.tsx`)

- Add a prominent "Generate All (184)" button that doesn't require manual selection
- Keep the existing selection-based generate for partial generation

## Files Changed

- **Modified**: `src/components/admin/seo/queue/QueueTable.tsx` -- add Category column
- **Modified**: `src/components/admin/seo/ContentQueue.tsx` -- add action banner for queued items
- **Modified**: `src/components/admin/seo/queue/QueueActions.tsx` -- add "Generate All Queued" button
- **Modified**: `src/hooks/useContentQueue.ts` -- add helper to fetch all queued IDs for "Generate All"

