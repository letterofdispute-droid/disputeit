

# Fix: Accurate Stats, Working Cancel, and Correct Progress

## Issues Found

### Issue 1: Stats hit the 1000-row limit
`useQueueStats` fetches all rows from `content_queue` with `.select('status')` but **no `.limit()` override**. Supabase defaults to 1000 rows max. The table currently has **980 rows** -- it will silently truncate data as soon as more items are added, making all counts wrong.

**Fix**: Use Supabase's `count: 'exact', head: true` with status filters to get accurate counts directly from the database without fetching rows.

### Issue 2: Cancel fails with "No active job to cancel"
The cancel button checks `activeJobId` state, which is `null` because the on-mount check (line 148-163) races with rendering. There IS a processing job (`f86dcc1d`) in the database right now. The check runs once on mount but if it completes before the component fully renders, the state is set but then the `isBulkGenerating` computed value (`!!activeJobId && activeJob?.status === 'processing'`) may not yet have the activeJob data loaded -- meaning the progress bar shows but `cancelJob` fires before the activeJob query resolves.

The deeper problem: `isBulkGenerating` on line 349 is `bulkGenerateMutation.isPending || (!!activeJobId && activeJob?.status === 'processing')`. After page reload, `bulkGenerateMutation.isPending` is false, and `activeJob` data hasn't loaded yet, so `isBulkGenerating` briefly flickers. But the progress bar shows because `selectedIds.size` is 0 but the fallback `total` picks up `stats.failed` (3), showing "0 of 3".

**Fix**: Make cancel work even without local `activeJobId` state -- query for any active processing job directly from the database when cancelling.

### Issue 3: Progress shows "0 of 3" instead of real job progress
When `generationProgress` is null (because `activeJob` hasn't loaded yet), the fallback on line 135 uses `selectedIds.size || stats.failed` which equals 3 (the failed count).

**Fix**: Once `activeJobId` is set from the mount check, wait for the `activeJob` query to load before showing progress. Use the job's real `total_items`.

## Changes

### 1. `src/hooks/useQueueStats.ts` -- Use count queries instead of fetching all rows
Replace the current approach (fetch all rows, count client-side) with parallel count queries per status. This scales to any number of rows.

### 2. `src/hooks/useContentQueue.ts` -- Fix cancel to always find active job
- Update `cancelJobMutation` to query for the active processing job from the database if `activeJobId` is null, then cancel it
- Ensure `isBulkGenerating` properly reflects when there's an active job even after page reload

### 3. `src/components/admin/seo/ContentQueue.tsx` -- Fix progress total fallback
- Don't show progress bar until `generationProgress` has real data from the job
- Remove the misleading `selectedIds.size || stats.failed` fallback

| File | Change |
|------|--------|
| `src/hooks/useQueueStats.ts` | Replace row-fetching with parallel count queries |
| `src/hooks/useContentQueue.ts` | Fix cancel to query DB for active job; fix isBulkGenerating |
| `src/components/admin/seo/ContentQueue.tsx` | Only show progress when job data is loaded |

