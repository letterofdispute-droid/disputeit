

# Fix Embedding Processing UX: Live Progress + Better Feedback

## Problem Analysis

Two issues are frustrating the user:

1. **Misleading toast**: When clicking "Process Now", the frontend invokes `process-embedding-queue` which processes 2 items per batch, then self-chains in the background. But the `onSuccess` callback fires after the first batch returns, showing "Queue processed - Processed 2 items, created 0 link suggestions" — making it seem like it stopped after 2 items.

2. **Stale progress bar**: The embedding stats (5780/6538) are fetched once on mount via `fetchEmbeddingStats()` and only re-fetched when `activeJob?.status` changes. The self-chaining queue processor doesn't use `embedding_jobs`, so the progress bar never auto-refreshes during processing.

## Plan

### 1. Add auto-polling for embedding stats while queue is processing

In `SemanticScanPanel.tsx`, after the user clicks "Process Now", start a polling interval that re-fetches embedding stats every 5 seconds. Stop polling when `queueStats.pending` reaches 0.

- Add a `isQueueActive` state that becomes true when processQueue is called
- Add a `useEffect` that polls `fetchEmbeddingStats` + `refetchQueueStats` every 5s while active
- Also add `refetchInterval` to the `embedding-queue-stats` query when queue has pending items

### 2. Change the toast to indicate background processing

In `useSemanticLinkScan.ts`, update the `processQueueMutation.onSuccess` handler:
- Instead of "Queue processed - Processed 2 items", show "Embedding processing started — 693 articles queued. Progress updates automatically."
- Use the `remaining` field from the response to show how many are left

### 3. Auto-refresh queue stats with refetchInterval

Add a `refetchInterval` to the `embedding-queue-stats` query that polls every 5s when there are pending items, similar to how `embedding-job-active` polls during processing.

## Files to Change

### `src/hooks/useSemanticLinkScan.ts`
- **Queue stats query** (line 153): Add `refetchInterval` that returns 5000 when `pending > 0`, false otherwise
- **processQueueMutation onSuccess** (line 423): Change toast message to indicate background processing is continuing, using the `remaining` count from the response. Update the return type to include `remaining`.

### `src/components/admin/seo/links/SemanticScanPanel.tsx`
- **Embedding stats refresh** (line 124): Add `queueStats?.pending` as a dependency so stats re-fetch each time queueStats updates (which now polls every 5s)
- This creates a cascade: queue stats poll every 5s → pending count changes → embedding stats re-fetch → progress bar updates

## What Changes Visually
- Clicking "Process Now" shows: "Processing started — 693 articles queued. Progress bar will update automatically."
- The progress bar (5780/6538) auto-increments every ~5 seconds as embeddings complete
- The "693 new articles ready to process" banner count decreases in real-time
- When all items finish, polling stops automatically

