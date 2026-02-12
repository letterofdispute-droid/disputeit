

# Resume Stuck Generation Job and Add Stale Job Recovery

## What Happened

The bulk article generation job (460 items) got stuck after processing 96 items (93 succeeded, 3 failed). The self-chaining mechanism broke when the URL-length 500 error occurred. After we deployed the fix, the chain was never restarted - so the job has been idle for ~6 hours while still showing "processing."

## Fix (Two Parts)

### Part 1: Immediately Resume the Stuck Job

Call the `bulk-generate-articles` edge function with the stuck job's ID to restart the self-chain. This will pick up right where it left off, processing the remaining 364 queued items.

### Part 2: Add Stale Job Detection + Resume Button

To prevent this from happening again silently, we will:

1. **Add a "Resume" button** to the `GenerationProgress` component that appears when a job appears stalled (no progress update in the last 5 minutes while still in "processing" status).

2. **Resume logic in `useGenerationJob` hook** - add a `resumeJob` mutation that calls the `bulk-generate-articles` edge function with the stalled job's ID to restart the chain.

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useGenerationJob.ts` | Add `resumeJob` mutation that POSTs `{ jobId }` to the edge function |
| `src/components/admin/seo/queue/GenerationProgress.tsx` | Add "Resume" button when job is stale (updated_at > 5 min ago and status is processing) |
| `src/components/admin/seo/ContentQueue.tsx` | Pass `resumeJob` and `isResuming` to `GenerationProgress` |

### How Stale Detection Works

```text
If job.status === 'processing'
  AND (now - job.updated_at) > 5 minutes
  -> Show "Stalled - Resume" button instead of spinner
```

The Resume button calls the same edge function endpoint with `{ jobId }` to restart the self-chain, exactly as if it had chained itself.

