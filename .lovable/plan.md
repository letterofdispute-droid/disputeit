
# Fix: Image Optimizer Counter Going Backwards

## Root Cause

The self-chain gets **504 Gateway Timeout** responses constantly. A 504 means the chained invocation IS running — it just took longer than the gateway allows. The current code treats 504 as a failure and retries, creating a **second concurrent invocation**. Both invocations then:

1. Read `processed = 416` from the database at the start
2. Process their own batch of 5 images
3. Write `processed = 416 + batchCount` — overwriting each other

This creates the backwards counter: 426 → 419 → 416 → 418.

## Fixes

### Fix 1: Atomic SQL Increments (Database Migration)

Create an RPC function that uses `SET processed = processed + X` instead of `SET processed = absoluteValue`:

```sql
CREATE FUNCTION increment_optimization_progress(
  p_job_id uuid,
  p_processed int,
  p_saved_bytes bigint,
  p_deleted int,
  p_new_offset int,
  p_errors jsonb DEFAULT '[]'
) ...
  UPDATE image_optimization_jobs SET
    processed = processed + p_processed,
    saved_bytes = saved_bytes + p_saved_bytes,
    deleted = deleted + p_deleted,
    current_offset = p_new_offset,
    errors = errors || p_errors,
    updated_at = now()
  WHERE id = p_job_id;
```

This eliminates the race condition entirely — even with concurrent invocations, each one safely adds its own contribution.

### Fix 2: Treat 504 as Success (Edge Function)

In `selfChainWithRetry`, treat a 504 response as a success — the chained function IS running. Only retry on actual failures (network errors, 500s):

```text
if (res.ok || res.status === 504) return  // 504 = function running, just slow
```

### Fix 3: Use Atomic RPC in handleOptimize (Edge Function)

Replace the `updateJob` calls in the batch processing path with the new `increment_optimization_progress` RPC. The `updateJob` function is still used for status changes (completed, cancelled) where absolute values are correct.

## Files to Change

| File | Change |
|------|--------|
| New migration | Create `increment_optimization_progress` RPC function |
| `supabase/functions/optimize-storage-images/index.ts` | 1) Use atomic RPC for progress updates. 2) Treat 504 as success in selfChainWithRetry. |

## Impact

- Counter will only ever go up, never backwards
- No more duplicate concurrent processing from unnecessary retries
- The pg_cron recovery still handles genuinely stalled jobs
