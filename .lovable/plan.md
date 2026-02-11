

# Fix Queue Stats Number Mismatch

## Problem

When you plan a category (e.g., Healthcare with 50 templates), the planner shows "344 articles will be created." But when you go to the queue, you see fewer items (e.g., 333). This is because:

1. The plan records `target_article_count = 7` per template (the goal)
2. The AI sometimes generates fewer than 6 unique article ideas (duplicates get filtered)
3. So only 5-6 queue items get inserted instead of 7
4. The Coverage Map and planning UI show the *target* number, but the queue shows the *actual* number

Across all categories, there are **71 missing items** (2,158 target vs 2,087 actual).

## Solution

Two changes to eliminate confusion:

### 1. Update `target_article_count` After Queue Insert

After the queue items are inserted in `generate-content-plan/index.ts`, update the plan's `target_article_count` to reflect the **actual** number of items created, not the theoretical goal.

**File:** `supabase/functions/generate-content-plan/index.ts`
- After the queue insert succeeds (line ~596), add an update:
  ```
  UPDATE content_plans SET target_article_count = actual_count WHERE id = plan.id
  ```
- This ensures the plan's count always matches reality

### 2. Fix Existing Data

Run a one-time migration to correct the `target_article_count` for all existing plans to match their actual queue item count.

**Migration SQL:**
```sql
UPDATE content_plans cp
SET target_article_count = sub.actual_count
FROM (
  SELECT plan_id, count(*) as actual_count
  FROM content_queue
  GROUP BY plan_id
) sub
WHERE cp.id = sub.plan_id
AND cp.target_article_count != sub.actual_count;
```

## Progress Bar (Already Working)

The progress bar is already implemented and persists across sessions:
- `useGenerationJob` hook polls the `generation_jobs` table every 3 seconds while a job is running
- `GenerationProgress` component shows a progress bar with succeeded/failed counts
- When you leave and return, it picks up the active job and displays current progress
- After completion, it shows a summary banner of the last finished job

No changes needed for the progress indicator.

## Technical Details

### File Changes

1. **`supabase/functions/generate-content-plan/index.ts`** (lines ~596-598)
   - After `queuedItems` insert succeeds, add: update the plan's `target_article_count` to `allQueueItems.length` (which equals `queuedItems.length`)
   - This is a one-line addition

2. **Database migration** (one-time fix)
   - Correct existing plans where target != actual queue count
   - Affects approximately 71 items across ~16 templates

