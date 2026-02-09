
# Reliable Large-Batch Processing (200+ Articles)

## The Core Problem
Right now, when you select 200 articles and click Generate, the processing happens in your browser. Your browser sends batches of 3 to the backend one after another. If you close the tab, lose internet, or your computer sleeps -- the loop stops and remaining articles stay queued forever. Plus, any single transient AI error permanently fails an article.

## Solution: Move the Orchestration to the Backend

Instead of the browser controlling the batch loop, we make the backend function self-chaining. You click "Generate 200 articles", the browser makes ONE call, and the backend processes 3 articles, saves them, then calls itself to process the next 3. This continues until all items are done -- even if you close the browser.

```text
Current flow (browser-dependent):
  Browser -> batch 1 -> wait -> batch 2 -> wait -> ... -> batch 67
  (if tab closes at batch 20, items 61-200 stay queued forever)

New flow (backend self-chaining):
  Browser -> "start job" -> done (browser free to close)
  Backend: batch 1 -> calls itself -> batch 2 -> calls itself -> ... -> batch 67
  (runs to completion regardless of browser state)
```

## What Changes

### 1. New DB table: `generation_jobs`
Track the overall job so the frontend can show progress without controlling anything.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Job ID |
| status | text | processing / completed / failed / cancelled |
| total_items | int | Total articles to generate |
| succeeded_items | int | Successfully generated so far |
| failed_items | int | Failed so far |
| queue_item_ids | uuid[] | All item IDs in this job |
| created_at | timestamptz | When job started |
| updated_at | timestamptz | Last progress update |
| completed_at | timestamptz | When job finished |
| bail_reason | text | CREDIT_EXHAUSTED / RATE_LIMITED if stopped early |

### 2. Update `bulk-generate-articles` edge function
- Accept a `jobId` parameter for self-chaining
- On first call: create a `generation_jobs` row, process first 3 items
- After each batch: update job progress, then fire-and-forget `fetch()` to itself with the `jobId` to continue
- On credit/rate errors: bail out and mark job accordingly
- Add simple retry (1 retry with 5s delay) for 5xx AI errors -- no JSON changes

### 3. Update frontend (`useContentQueue.ts`)
- `bulkGenerate` sends ONE request with all item IDs, gets back a `jobId`
- Poll `generation_jobs` table for progress instead of managing a for-loop
- Browser tab can be closed -- job continues on backend
- Show progress bar from job table data

### 4. Frontend progress polling
- New query watches the `generation_jobs` row by ID
- Updates progress bar (succeeded/total), shows current batch
- When job status = completed/failed, stop polling and show toast

## What Does NOT Change
- The JSON parser stays exactly as-is (no touching it)
- The article generation logic (prompts, images, keywords) stays identical
- The 3-item batch size stays the same
- The bail-out on 402/429 stays the same
- The stale-item detection with `started_at` stays the same

## Files Modified

| File | Change |
|------|--------|
| Database migration | Create `generation_jobs` table with RLS |
| `supabase/functions/bulk-generate-articles/index.ts` | Add self-chaining: accept jobId, create/update job row, fire-and-forget next batch, add 1x retry on 5xx |
| `src/hooks/useContentQueue.ts` | Replace browser loop with single call + job polling |
| `src/components/admin/seo/queue/GenerationProgress.tsx` | Minor: show job-based progress |

## Risk Assessment
- **Self-chaining pattern**: Already proven in this codebase (`bulk-plan-category` uses it). Low risk.
- **5xx retry**: Single retry with 5s delay. Cannot make things worse -- these items already fail permanently today.
- **No JSON changes**: Zero risk here since we're not touching it.
- **Migration**: Additive table, no existing data affected.
