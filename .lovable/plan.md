

# Fix: Image Optimizer "Failed to fetch" -- Two Blocking Awaits

## Root Cause

There are two bugs causing the "Failed to fetch" error:

1. **Client-side**: `handleOptimize` awaits the edge function response. The function processes a full batch of 5 images (downloading, decoding, compressing, uploading each) before returning. This takes 20-30+ seconds, causing the browser fetch to timeout.

2. **Edge function self-invoke**: `selfInvokeWithRetry` uses `await fetch(...)` and checks `response.ok`. This means each batch waits for the NEXT batch to finish before it can return its own response. This creates a cascading chain: batch 1 waits for batch 2, which waits for batch 3... until Cloudflare's gateway kills the chain with 502/504 errors (visible in the logs: "Attempt 1 got 504", "Attempt 1 got 502").

## Fix

### Change 1: Fire-and-forget self-invoke (Edge Function)

Replace the `await fetch()` in `selfInvokeWithRetry` with a fire-and-forget pattern. Don't wait for the response -- just confirm the request was sent:

```text
selfInvokeWithRetry(body):
  fetch(url, { method: 'POST', headers, body })
    .then(res => {
      if (!res.ok) log warning
    })
    .catch(err => {
      log warning
      // retry once after delay
      setTimeout(() => {
        fetch(url, { method: 'POST', headers, body }).catch(log)
      }, 2000)
    })
```

This breaks the cascading wait chain. Each batch fires and forgets the next one.

### Change 2: Fire-and-forget client call (ImageOptimizer.tsx)

Change `handleOptimize` to not await the edge function response. Instead, fire the request and immediately start polling:

```text
handleOptimize:
  callFunction({ mode: 'optimize', jobId }).catch(err => log warning)
  setJob(prev => ({ ...prev, status: 'optimizing' }))
  startPolling(job.id)
```

Same change for `handleResume`.

### Change 3: Return early from optimize mode (Edge Function)

As an additional safety measure, restructure `handleOptimize` to return the HTTP response immediately before processing the batch. Use Deno's event loop to continue processing in the background:

The edge function should return `{ ok: true, started: true }` immediately, then process the batch. This prevents any HTTP timeout regardless of how long processing takes.

Since Deno.serve doesn't have a built-in `waitUntil`, we can use the pattern of returning the response first and letting the async work continue via a detached promise.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/optimize-storage-images/index.ts` | Make selfInvoke fire-and-forget (no await on response); restructure optimize handler to not block the HTTP response |
| `src/components/admin/storage/ImageOptimizer.tsx` | Make handleOptimize and handleResume fire-and-forget (don't await response, start polling immediately) |

## Why This Was Failing

```text
BEFORE (cascading awaits):
  Client AWAITS -> Batch 1 processes -> AWAITS selfInvoke -> Batch 2 processes -> AWAITS selfInvoke -> ...
  Result: Everything hangs, Cloudflare kills with 502/504

AFTER (fire-and-forget):
  Client fires -> returns immediately, starts polling
  Batch 1 processes -> fires selfInvoke -> returns immediately  
  Batch 2 processes -> fires selfInvoke -> returns immediately
  Each batch is independent, no cascading waits
```
