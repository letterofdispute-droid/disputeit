

# Fix: Image Optimizer Concurrent Instance Double-Processing

## What's Happening

The counter shows **3265 / 2651** (and the database shows `processed = 5163`) because multiple concurrent instances are running simultaneously. Each one:

1. Reads `current_offset = 500` from the database
2. Processes images at offset 500-504
3. Atomically increments `processed += 5` (good)
4. Sets `current_offset = 505` (bad -- overwrites, doesn't claim)

Three concurrent instances all read offset 500, all process the same 5 images, all increment processed by 5 (total +15 for 5 images), and all set offset to 505. Then they repeat.

## The Fix: Atomic Offset Claiming

Replace the current "read offset, process, write offset" pattern with an atomic **claim** mechanism. Each function instance atomically grabs its own offset range before processing, so no two instances ever work on the same batch.

### New RPC: `claim_optimization_batch`

```sql
CREATE FUNCTION claim_optimization_batch(p_job_id uuid, p_batch_size int)
RETURNS int  -- returns the claimed offset, or -1 if nothing to claim
```

This function atomically:
1. Reads the current offset
2. If offset >= oversized_files, returns -1 (done)
3. Advances `current_offset` by `batch_size`
4. Returns the OLD offset (the one this instance should process)

Because it runs as a single SQL transaction, no two instances can claim the same offset.

### Edge Function Changes

Replace the current flow:
```text
OLD: job = readJob() -> process(job.current_offset) -> writeOffset(offset + BATCH_SIZE)
NEW: claimedOffset = claimBatch(jobId) -> if -1, complete -> process(claimedOffset) -> incrementProgress()
```

The `increment_optimization_progress` RPC no longer needs to set `current_offset` since claiming already advanced it.

### Updated `increment_optimization_progress`

Remove `p_new_offset` parameter since offset is now managed by the claim RPC. Only increments processed/saved/deleted/errors.

## Files to Change

| File | Change |
|------|--------|
| New migration | 1) Create `claim_optimization_batch` RPC. 2) Update `increment_optimization_progress` to remove offset param. |
| `supabase/functions/optimize-storage-images/index.ts` | Use claim-based flow: call `claim_optimization_batch` to get offset, use `get_optimization_batch` with that offset, process, then call updated `increment_optimization_progress`. |

## Impact

- Each batch is processed exactly once, even with concurrent instances
- Counter will never exceed total oversized count
- The existing job should be cancelled and a fresh scan started after deploying

