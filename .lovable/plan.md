

# Fix: Stop Batch Chaining on Credit Exhaustion / Rate Limit

## Problem
When 500 items are queued and credits run out at item ~100, the frontend continues sending the remaining ~130+ batches to the edge function. Each batch immediately fails, wasting time (~2-3 seconds per batch = several minutes of pointless waiting). No credits are wasted, but the UX is poor.

## Solution
Add early termination to the frontend batch loop. When a batch returns results showing `CREDIT_EXHAUSTED` or `RATE_LIMITED` failures, stop chaining and show an immediate, clear notification.

## Changes

### 1. `src/hooks/useContentQueue.ts`
- In the `bulkGenerateMutation` sequential loop, after each batch completes, inspect the response `data.results` array for any error messages starting with `CREDIT_EXHAUSTED:` or `RATE_LIMITED:`
- If detected, `break` out of the loop immediately instead of continuing to the next chunk
- Mark the remaining unchunked item IDs as `failed` in the database with a "Skipped" message (so the queue stats are accurate)
- Return a new flag like `bailedOut: true` and `bailReason: 'CREDIT_EXHAUSTED' | 'RATE_LIMITED'` in the mutation result

- Apply the same logic to the `retryFailedMutation` loop (identical pattern)

### 2. `src/hooks/useContentQueue.ts` — Toast/Notification
- In `onSuccess` for both mutations, check the `bailedOut` flag
- If true, show a specific toast:
  - Title: "Generation paused"
  - Description: "AI credits exhausted after {succeeded} articles. Remaining {remaining} items marked as failed. Top up your Google Gemini credits, then retry."
  - Variant: `destructive`

### 3. `supabase/functions/bulk-generate-articles/index.ts`
- Already returns individual `results` with error messages — no changes needed here. The edge function bail-out within a batch already works correctly.
- One small addition: include a top-level `bailReason` field in the response when the batch bailed out, making it easier for the frontend to detect without scanning individual results:
  ```json
  { "success": true, "succeeded": 1, "failed": 2, "bailReason": "CREDIT_EXHAUSTED", "results": [...] }
  ```

## Technical Details

In the frontend loop, the check looks like:

```typescript
// After each batch response
if (data?.bailReason === 'CREDIT_EXHAUSTED' || data?.bailReason === 'RATE_LIMITED') {
  // Mark remaining chunks as failed in DB
  const remainingIds = chunks.slice(i + 1).flat();
  if (remainingIds.length > 0) {
    await supabase
      .from('content_queue')
      .update({ 
        status: 'failed', 
        error_message: `${data.bailReason}: Skipped — generation paused due to ${data.bailReason === 'CREDIT_EXHAUSTED' ? 'exhausted AI credits' : 'rate limiting'}.`
      })
      .in('id', remainingIds);
  }
  break; // Stop chaining
}
```

## What the User Sees

1. Starts generating 500 articles
2. Progress bar advances: "Batch 12/167 — 36 of 500"
3. Credits exhaust at article ~100
4. Progress immediately stops
5. Toast appears: "Generation paused — AI credits exhausted after 98 articles. 402 remaining items skipped. Top up your Gemini API credits, then retry failed items."
6. FailureSummary banner shows with the breakdown
7. User can click "Retry All Failed" after topping up credits

## Files Modified
- `src/hooks/useContentQueue.ts` — add bail-out detection to both mutation loops
- `supabase/functions/bulk-generate-articles/index.ts` — add `bailReason` field to response

