

# Fix "Articles Generated" Showing 1000 and Stale Job Banner

## Problem 1: Articles Generated capped at 1000

The `CoverageStats` component counts articles by filtering the `queueItems` array, which is fetched with `.limit(1000)`. The actual count is **2,028** (631 generated + 1,397 published), but the UI shows 1000.

### Fix

Refactor `CoverageStats` to use the existing `useQueueStats` hook for article counts instead of counting from the truncated `queueItems` array. This hook already uses `{ count: 'exact', head: true }` queries that bypass the row limit.

**File: `src/components/admin/seo/CoverageStats.tsx`**
- Import and use `useQueueStats` for the article counts (generated, queued, published)
- Remove the dependency on `useContentQueue` entirely (it was only used for counting)
- Calculate "Articles Generated" as `generated + published` from the stats hook
- This gives accurate numbers regardless of volume

## Problem 2: Stale "Generation stopped" banner

The dashboard shows "Generation stopped -- 3 succeeded, 0 failed" from a **cancelled** job, even though the most recent job completed successfully with 5/5. The `useGenerationJob` hook's `lastCompletedJob` query picks up any terminal job, and the cancelled job appears because of ordering.

### Fix

**File: `src/hooks/useGenerationJob.ts`**
- Update the `lastCompletedJob` query to prefer `completed` status over `cancelled`/`failed`
- Or add a time limit so stale completed/cancelled jobs older than a reasonable window (e.g., 1 hour) are not shown
- Ensure the banner shows the most relevant recent job, not a stale cancelled one

## Technical Details

### CoverageStats Changes
- Remove `useContentQueue` import
- Add `useQueueStats` import (already exists at `@/hooks/useQueueStats`)
- Replace `queueItems`-based counting with stats from the hook:
  - `articlesGenerated = stats.generated + stats.published`
  - `articlesQueued = stats.queued`
  - `articlesPublished = stats.published`
- Keep `useContentPlans` for template/tier calculations (those are fine under 1000)

### GenerationJob Changes
- Review `lastCompletedJob` query ordering to prioritize `completed` over `cancelled`
- Add recency filter to avoid showing old job banners indefinitely

