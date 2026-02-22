

# Fix Link Restoration: Full-Scale Scan and Recovery

## Current Problems

1. **Health check only scans 500 posts** -- the `batchSize: 500` in the UI sends a single request with no pagination. There are 5,780 published posts, so 91% are never checked.
2. **Restore processes 50 posts at a time** calling `scan-for-semantic-links` per post individually -- extremely slow and impractical for 3,700+ affected posts.
3. **Counter sync not run first** -- `outbound_count` in `article_embeddings` is stale, making the health check unreliable.

### Actual damage (from database):
- 973 posts have 0 internal links
- 2,759 posts have 1-2 internal links
- 2,048 posts have 3+ links (healthy)
- ~3,732 posts need link restoration

## Solution

### Step 1: Fix Health Check to Paginate Through ALL Posts

Update `restore-stripped-links` scan mode to auto-paginate through all posts (like the URL scanner already does), accumulating totals across batches.

Update the UI (`BrokenLinkScanner.tsx`) to loop through batches client-side with a progress bar, exactly like the URL scanner's `runScan` function already does.

### Step 2: Use Existing Bulk Semantic Scan for Restoration

Instead of the slow per-post restore approach, leverage the **existing bulk semantic scan system** that already handles batching, self-chaining, and job tracking:

1. First reconcile counters (sync `outbound_count` with actual content)
2. Then trigger a full semantic scan (the existing "Scan All" button in the Links panel)
3. Auto-approve high-relevance suggestions
4. Apply links in bulk

The restore function will be simplified to:
- **Step 1**: Reconcile counters
- **Step 2**: Reset `next_scan_due_at` for all low-link posts so the existing scan picks them up
- **Step 3**: Trigger the existing bulk semantic scan job

### Step 3: Update UI for Full Workflow

The BrokenLinkScanner's Link Restoration section will:
- Show a paginated health check with real progress (e.g., "2,100 of 5,780 checked")
- Show accurate totals across all posts
- "Restore" button will: reconcile counters, reset scan timestamps for affected posts, then redirect user to use the existing semantic scan pipeline

## Technical Details

### `supabase/functions/restore-stripped-links/index.ts`

**Scan mode changes:**
- Remove per-post content checking (too slow for 5,780 posts)
- Instead, use `outbound_count` from `article_embeddings` directly (after reconcile)
- Return paginated results with `{ count: 'exact' }` for accurate totals

**Restore mode changes:**
- Step 1: Call `reconcile_link_counts` RPC
- Step 2: Reset `next_scan_due_at = null` for all posts with `outbound_count <= 2`
- Step 3: Return count of affected posts -- user then triggers existing semantic scan from the Links panel

### `src/components/admin/seo/BrokenLinkScanner.tsx`

**Health check changes:**
- Loop through batches of 1,000 with progress tracking (like the URL scanner)
- Show running totals as each batch completes
- Display final count of all posts needing links

**Restore button changes:**
- Calls restore endpoint which reconciles + resets scan timestamps
- Shows toast directing user to run "Scan All" from the Links panel
- Or auto-triggers the semantic scan via `scan-for-semantic-links`

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/restore-stripped-links/index.ts` | Simplify: reconcile counters, reset scan timestamps, use outbound_count directly instead of per-post content checking |
| `src/components/admin/seo/BrokenLinkScanner.tsx` | Paginated health check with progress bar, streamlined restore that uses existing semantic scan pipeline |

