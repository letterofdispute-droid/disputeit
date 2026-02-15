

# Fix Link Stats Sync and Stale Job Issues

## Problem Summary

Three interconnected bugs on the Links tab:

1. **"Internal Links: 50"** in the top stats card -- counts only the 50 items on page 1 instead of querying the database for the real total
2. **"Discovering links..." spinner stuck** -- the scan panel picks up the apply job (which uses the same `semantic_scan_jobs` table) and shows it as a discovery scan
3. **Apply counter exceeds total (17501 / 14681)** -- the old apply job is stuck in `processing` status because the fix was deployed after it started looping

## Changes

### 1. CoverageStats.tsx -- Use DB counts instead of client-side counting

**Current**: Calls `useLinkSuggestions()` with no params, gets 50 items, counts `.filter(s => s.status === 'applied').length` (max 50).

**Fix**: Replace the `useLinkSuggestions` import with a dedicated lightweight query that counts applied and pending links using `{ count: 'exact', head: true }`. This avoids loading any suggestion rows just for the stats card.

```typescript
// Replace useLinkSuggestions() with a direct count query
const { data: linkCounts } = useQuery({
  queryKey: ['link-counts-overview'],
  queryFn: async () => {
    const [applied, pending] = await Promise.all([
      supabase.from('link_suggestions').select('*', { count: 'exact', head: true }).eq('status', 'applied'),
      supabase.from('link_suggestions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    return { applied: applied.count || 0, pending: pending.count || 0 };
  },
  staleTime: 30000,
});
```

### 2. SemanticScanPanel.tsx -- Filter out apply jobs from scan display

**Current**: `activeScanJob` is the most recent job in `semantic_scan_jobs` regardless of type. If it's an apply job (`category_filter = '__apply_links__'`), the panel shows "Discovering links..." incorrectly.

**Fix**: Add a condition to exclude apply jobs from the scan progress display. The `isScanJobRunning` and scan progress section should only show when `activeScanJob.category_filter !== '__apply_links__'`.

### 3. useSemanticLinkScan.ts -- Exclude apply jobs from scan job query

**Current**: The `activeScanJob` query (line 96-113) fetches the most recent `semantic_scan_jobs` row with no filter, so it can return an apply job.

**Fix**: Add a filter to exclude apply jobs: `.neq('category_filter', '__apply_links__')`. This way `isScanJobRunning` only reflects actual discovery scans, not apply jobs. The apply job tracking is already handled separately in `LinkSuggestions.tsx` via a dedicated query or the existing `activeApplyJob` memo.

But we also need a separate query for the apply job -- add a second query specifically for `category_filter = '__apply_links__'` jobs so `LinkSuggestions` can track apply progress independently.

### 4. Clean up stale apply job

The stuck job (17501/14681) needs to be marked as completed. Add a check: if an apply job has `processed_items > total_items`, treat it as completed in the UI. Also consider adding a one-time data fix to mark the stale job as completed.

## Files to Edit

- **src/components/admin/seo/CoverageStats.tsx** -- Replace `useLinkSuggestions` with direct DB count query
- **src/hooks/useSemanticLinkScan.ts** -- Split `activeScanJob` into two queries: one for discovery scans (excluding apply), one for apply jobs; export both
- **src/components/admin/seo/LinkSuggestions.tsx** -- Use the new dedicated apply job query from `useSemanticLinkScan` instead of deriving it from `activeScanJob`
- **src/components/admin/seo/links/SemanticScanPanel.tsx** -- No changes needed if the hook is fixed (the scan panel already uses `isScanJobRunning` and `activeScanJob` from the hook)

## Result

- "Internal Links" card shows real DB count (e.g., 4,883 applied)
- Discover Links section only shows spinner for actual discovery scans
- Apply job progress only appears in the toolbar area, not in the scan panel
- Stale/overflowed apply jobs are treated as completed in the UI
