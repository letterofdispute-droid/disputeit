

# Fix: Generation Progress Counter Missing Retried Items

## What Happened

All 10 articles are safe -- 9 generated, 1 failed. The banner incorrectly shows "7 succeeded, 1 failed" because of two bugs:

1. **Race condition at completion**: When the job finishes processing, it re-counts item statuses from the database. But items retried via the automatic retry mechanism may still be in `generating` status at the moment of counting. These get counted as neither succeeded nor failed, creating the gap.

2. **Infinite retry loop risk**: Failed items are retried automatically, but when a retry fails again, the error message has no prefix to mark it as already-retried. The system would attempt to retry it again indefinitely until something else stops it.

## Fixes

### Fix 1: Handle "generating" items at completion time

In the `finally` block of the continuation path, before calling `completeJob`, check if any items are still in `generating` status. If so, wait briefly and re-check, or self-chain instead of completing prematurely.

```text
// Before completing:
const generatingCount = finalItems.filter(i => i.status === 'generating').length;
if (generatingCount > 0) {
  // Items still processing -- self-chain to check again
  await selfChainWithRetry(jobId);
  return;
}
// Safe to complete
await completeJob(supabaseAdmin, jobId, finalSucceeded, finalFailed);
```

### Fix 2: Prefix retry failures with "RETRY_FAILED:"

When a retried item fails again, the error message should be prefixed so the retry checker does not attempt infinite retries. In `generateSingleArticle`, after the retry mechanism resets items, mark subsequent failures:

```text
// In the retry pass: before resetting items to queued, store that this is a retry
// When the retried item fails, prefix the error:
error_message = "RETRY_FAILED: " + originalError
```

This is already partially implemented (line 1261 checks for the prefix) but nothing ever SETS it. The fix is to track which items are retries and prefix their errors accordingly.

### Fix 3: Mark "generating" items as failed in the catch block

In the outer `catch` at line 1339-1342, when an unexpected error occurs during batch processing, the item stays stuck in `generating` status. Update it to `failed`:

```text
} catch (unexpectedError) {
  console.error('Unexpected error:', unexpectedError);
  batchFailed++;
  // Also mark the current item as failed
  for (const item of nextItems) {
    await supabaseAdmin.from('content_queue')
      .update({ status: 'failed', error_message: 'Unexpected processing error' })
      .eq('id', item.id)
      .eq('status', 'generating');
  }
}
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/bulk-generate-articles/index.ts` | 1) Add generating-item check before completing job. 2) Prefix retry failure errors with "RETRY_FAILED:". 3) Mark generating items as failed in catch block. |

## Impact

- The progress banner will show accurate counts (9/1 instead of 7/1)
- No more infinite retry loops for items that consistently fail
- No more "missing" items in the counter

