

# Bulletproof Image Storage Optimizer

## Root Cause

The self-chain keeps breaking because:
1. `selfInvoke` is fire-and-forget — if it fails, no one knows
2. A single corrupt image can hang the entire batch until timeout, killing the chain
3. Every batch loads 130KB of `file_list` JSON unnecessarily via `SELECT *`
4. The pg_cron job marks stale jobs as `failed` instead of restarting them
5. If the batch processing throws an unhandled error, the self-chain never fires

## Solution: Five Layers of Reliability

### Layer 1: Guaranteed Self-Chain (Edge Function)

Restructure `handleOptimize` so the self-invoke happens in a `finally` block, ensuring the chain continues even if the batch crashes:

```text
try {
  process batch of 5 images
  update job with results
} catch (error) {
  log error, increment offset anyway (skip bad batch)
} finally {
  if (hasMore && !cancelled) selfInvoke with retry
}
```

### Layer 2: Self-Invoke with Retry (Edge Function)

Replace the fire-and-forget `fetch` with an `await`-ed call that retries once on failure:

```text
async selfInvoke(body):
  for attempt in [1, 2]:
    try:
      response = await fetch(url, ...)
      if response.ok: return true
    catch:
      log warning
      wait 2 seconds
  log CRITICAL: self-invoke failed after 2 attempts
  return false
```

### Layer 3: Per-Image Timeout (Edge Function)

Wrap each image's download+decode+compress cycle in a 20-second timeout using `Promise.race`:

```text
for each file in batch:
  result = await Promise.race([
    processImage(file),     // download, decode, compress, upload
    timeout(20_000)         // 20 second deadline
  ])
  if timed out: log + skip, continue to next image
```

This prevents a single bad image from killing the entire batch.

### Layer 4: Don't Load file_list on Every Batch (Database + Edge Function)

Create a database function that returns just the batch slice instead of loading the entire 130KB JSONB array:

```sql
CREATE FUNCTION get_optimization_batch(p_job_id uuid, p_offset int, p_limit int)
RETURNS jsonb
```

The edge function calls this RPC to get just 5 items instead of all 4255.

Also change `getJob` for optimize batches to `select` only the columns it needs (excluding `file_list`).

### Layer 5: Auto-Resume via pg_cron (Database)

Change the existing `recover_stale_image_optimization_jobs` pg_cron function from marking stale jobs as `failed` to calling the edge function to resume them:

Since pg_cron can't directly call edge functions, use a two-step approach:
- pg_cron resets stale `optimizing` jobs by bumping `updated_at` (giving a fresh 15-min window)
- Add a `net.http_post` call via pg_net to directly invoke the edge function with the stalled job's ID

This creates fully automatic recovery with zero manual intervention.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/optimize-storage-images/index.ts` | Guaranteed self-chain in finally block, await+retry selfInvoke, per-image timeout, use RPC for batch fetching |
| Database migration | Create `get_optimization_batch` RPC function; update `recover_stale_image_optimization_jobs` to auto-resume via pg_net |

## Failure Scenarios Covered

| Scenario | Before | After |
|----------|--------|-------|
| Self-invoke HTTP fails | Chain dies silently | Retries once, logs critical warning |
| Corrupt image hangs decode | Batch times out, chain dies | 20s timeout per image, skip + continue |
| Batch processing crashes | Chain dies | `finally` block ensures next batch fires |
| Chain breaks for unknown reason | Manual Resume button (5 min) | pg_cron auto-resumes every 5 min via pg_net |
| 130KB file_list loaded per batch | Slow DB reads every 3 seconds | RPC returns only the 5-item slice needed |
| Edge function cold start fails invoke | Chain dies | Retry with 2s delay handles cold starts |

## Processing Flow After Fix

```text
handleOptimize(jobId):
  1. getJobLite(jobId)           -- fetch job WITHOUT file_list
  2. Check cancelled? -> stop
  3. getBatch(jobId, offset, 5)  -- RPC returns only 5 items
  4. try:
       for each file (with 20s timeout):
         download -> decode -> compress -> upload
       update job (processed, saved_bytes, offset)
     catch:
       log error, bump offset to skip batch
     finally:
       if hasMore: await selfInvoke({ mode: 'optimize', jobId }) with retry

BACKGROUND RECOVERY (pg_cron every 5 min):
  Find jobs where status='optimizing' AND updated_at < 5 min ago
  For each: call edge function via pg_net to resume
```

