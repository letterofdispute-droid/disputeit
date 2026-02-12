
# Bulletproof Article Generation Chain

## Problem

The article generation job keeps stalling because `selfChain` has the same three vulnerabilities we just fixed in the image optimizer:

1. **No `finally` block** -- If `generateSingleArticle` throws an unexpected error (e.g., a DB timeout, an unhandled edge case in JSON parsing), the code never reaches the `selfChain()` call at line 1362. The chain silently dies.

2. **Fire-and-forget with no retry** -- `selfChain` does `fetch(...).catch(log)`. If the HTTP call fails (cold start, 502, network blip), there's no second attempt. The chain dies silently.

3. **No automatic recovery** -- Unlike the image optimizer (which now has pg_cron auto-resume), there's no background mechanism to detect and restart stalled generation jobs. The only option is the manual "Resume" button after 5 minutes.

## Solution: Apply the Same Three Fixes

### Fix 1: Wrap batch processing in try/finally

Move `selfChain()` into a `finally` block so the chain continues even if an article generation crashes unexpectedly:

```text
let shouldContinue = true;

try {
  // process batch, update progress
  if (bailReason) shouldContinue = false;
} catch (error) {
  log error, bump failed count, update job
} finally {
  if (shouldContinue && hasMoreItems) {
    selfChainWithRetry(jobId);
  } else if (!shouldContinue || !hasMoreItems) {
    completeJob(...)
  }
}
```

### Fix 2: Add retry to selfChain

Replace the fire-and-forget `fetch().catch()` with a function that attempts twice with a 2-second delay between attempts:

```text
async selfChainWithRetry(jobId):
  for attempt in [1, 2]:
    try:
      response = await fetch(url, { method: 'POST', ... })
      if response.ok:
        log success
        return
      log "Attempt {attempt} got {status}"
    catch (err):
      log "Attempt {attempt} failed: {err}"
    await sleep(2000)
  log "CRITICAL: selfChain failed after 2 attempts"
```

This is awaited but only takes ~4 seconds max if both attempts fail -- not a cascading timeout since each invocation processes independently.

### Fix 3: Add pg_cron auto-recovery

Create a database function + cron job that detects generation jobs stuck in `processing` with no progress for 5+ minutes, and uses `pg_net` to re-invoke the edge function automatically:

```sql
CREATE OR REPLACE FUNCTION recover_stale_generation_jobs()
  -- Find jobs where status='processing' AND updated_at < 5 min ago
  -- For each: call edge function via pg_net with { jobId }
  -- Mark very old jobs (30+ min stale) as failed
```

Schedule it to run every 5 minutes via pg_cron.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/bulk-generate-articles/index.ts` | Wrap continuation path in try/finally; replace `selfChain` with `selfChainWithRetry` |
| Database migration | Create `recover_stale_generation_jobs` function + pg_cron schedule |

## Failure Scenarios Covered

| Scenario | Before | After |
|----------|--------|-------|
| generateSingleArticle throws | Chain dies | `finally` fires selfChain |
| selfChain HTTP 502/504 | Chain dies | Retries once after 2s |
| Edge function cold start fails | Chain dies | Retry handles it |
| Chain breaks for any reason | Manual Resume (5 min wait) | pg_cron auto-resumes every 5 min |
| DB timeout during batchedInQuery | Chain dies | `finally` + pg_cron recovery |
