

# Make Step 2 (Discover Links) a True Fire-and-Forget Background Job

## Problem

Step 2 currently processes only 10 articles per click. With 4,627 articles, you'd need to click "Scan for Links" ~463 times. There's no self-chaining like Step 1 has.

## Solution

Add self-chaining to the `scan-for-semantic-links` edge function (same pattern as `generate-embeddings`) so one click processes ALL articles automatically.

## Changes

### 1. Edge Function: `supabase/functions/scan-for-semantic-links/index.ts`

Add self-chaining after each batch completes:
- After processing the batch of 10 articles, check if more articles need scanning (`next_scan_due_at` still in the past)
- If yes, fire-and-forget invoke itself with the same parameters (using the AbortController pattern from the existing codebase)
- If no more articles to process, stop and return final results
- Add a `jobId` tracking parameter so the UI can poll for progress (reuse or create a lightweight tracking row)

### 2. Database: Add a `semantic_scan_jobs` table (or reuse `embedding_jobs` with a different `content_type`)

Track scan progress so the UI can show a real progress bar:
- `id`, `status` (processing/completed/failed), `total_items`, `processed_items`, `created_at`, `completed_at`
- The edge function creates a job row on first invocation, updates `processed_items` atomically on each batch

### 3. UI: `src/components/admin/seo/links/SemanticScanPanel.tsx`

- Replace the instant "Scanning..." state with a real progress bar (poll the job table, same pattern as Step 1)
- Show: "Scanning 120 / 4,627 articles..." with a progress bar
- Add a cancel button
- When complete, show: "Scan complete -- found X link suggestions"
- Rename button from "Scan for Links" to "Discover All Links" to clarify it's comprehensive

### 4. Hook: `src/hooks/useSemanticLinkScan.ts`

- Add a query for the active scan job (poll every 2s while processing, same as embedding job)
- Track scan job progress for the UI

## How it works after the fix

```text
User clicks "Discover All Links"
  --> Edge function creates scan job (total: 4,627)
  --> Processes batch of 10, updates job (processed: 10)
  --> Self-chains to process next batch
  --> ... repeats until all done ...
  --> Marks job complete
  
UI polls job every 2s, shows progress bar
User can leave and come back -- job continues server-side
```

## Files changed

- `supabase/functions/scan-for-semantic-links/index.ts` -- add self-chaining + job tracking
- `src/hooks/useSemanticLinkScan.ts` -- add scan job polling query
- `src/components/admin/seo/links/SemanticScanPanel.tsx` -- progress bar + clearer labels
- Database migration: create `semantic_scan_jobs` table (or add scan tracking to existing structure)

