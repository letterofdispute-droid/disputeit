
# Make "Apply to Articles" Process All Approved Links

## Problem

The `apply-links-bulk` edge function has a hard `.limit(100)` on line 420. It fetches 100 approved suggestions, processes them, and returns. With 14,665 approved links, it only handles ~100 and stops.

## Solution

Convert `apply-links-bulk` into a self-chaining background job using the same `semantic_scan_jobs` table already used by other scan functions. The UI will show a progress bar while it processes batches of 20 articles at a time.

## Changes

### 1. Edge Function: `supabase/functions/apply-links-bulk/index.ts`

- Add a `selfChainWithRetry` function (same pattern as `scan-for-smart-links`)
- On first call (no `jobId`): create a `semantic_scan_jobs` row with `scan_type: 'apply'`, count approved suggestions, set `total_items`
- On chained calls (with `jobId`): fetch next batch of 20 approved suggestions, process them, update `processed_items`, then self-chain
- Remove the `.limit(100)` cap -- use `.limit(20)` per batch instead (each suggestion may call AI, so keep batches small)
- Mark job as `completed` when no more approved suggestions remain
- Add `try/finally` to ensure self-chaining even on errors
- Return immediately on first call with `{ jobId }` so the browser doesn't time out

### 2. Hook: `src/hooks/useLinkSuggestions.ts`

- Update `applyLinksMutation` to accept `{ jobId }` response and no longer expect all results inline
- After mutation fires, the existing `isScanJobRunning` polling in `useSemanticLinkScan` will pick up the new job automatically (since it queries `semantic_scan_jobs` ordered by `created_at desc`)

### 3. UI: `src/components/admin/seo/links/LinkActions.tsx`

- While an apply job is running (detected via `activeScanJob` with `scan_type: 'apply'`), replace the "Apply to Articles" button with a progress bar showing processed/total
- Add a "Cancel" button to stop the apply job mid-way

### 4. Component: `src/components/admin/seo/LinkSuggestions.tsx`

- Pass `activeScanJob` data down to `LinkActions` for progress display
- Detect apply-type jobs vs scan-type jobs

## Batch Flow

```text
Browser clicks "Apply to Articles"
  |
  v
Edge Function (1st call):
  - Creates job in semantic_scan_jobs (scan_type: 'apply')
  - Returns { jobId } immediately
  |
  v
Edge Function (self-chain, batch 1):
  - Fetches 20 approved suggestions
  - Processes each (insert links into HTML)
  - Updates processed_items += batch size
  - Self-chains to next batch
  |
  v
Edge Function (self-chain, batch N):
  - No more approved suggestions found
  - Marks job as 'completed'
  |
Browser polls semantic_scan_jobs every 2s
  - Shows progress bar: "Applied 240 / 14665"
  - On completion: refreshes link suggestions list
```

## Technical Details

### Edge function batch processing (per chain):
1. Check job status (stop if cancelled)
2. Fetch next 20 approved suggestions with `blog_posts` and `article_embeddings` joins
3. Group by post, process each post's suggestions (same logic as current)
4. Atomically increment `processed_items` via `SET processed_items = processed_items + X`
5. Self-chain with `{ jobId }` in `try/finally`
6. If no suggestions remain, mark job completed

### Progress tracking:
- Reuses the existing `semantic_scan_jobs` table and polling already in `useSemanticLinkScan`
- A new `scan_type` field distinguishes apply jobs from scan jobs (or we use the existing `category_filter` field with a sentinel value like `__apply__`)
- Actually simpler: just add a `job_type` column or use a convention in the existing `status` field

### Alternative (no schema change):
- Store job tracking in a simple convention: when `apply-links-bulk` creates a job, it sets `category_filter = '__apply_links__'` and `similarity_threshold = 0` as markers
- The UI checks for this marker to show apply progress vs scan progress

## Result

- All 14,665 approved links get processed reliably in batches of 20
- Progress bar shows real-time status
- Cancel button allows stopping mid-way
- No browser timeouts -- fire-and-forget with polling
- Same battle-tested self-chaining pattern used by scan functions
