

# Speed Up Link Discovery Scans

## Problem

Both scan modes are slow because they process articles **sequentially** (one at a time within each batch) and use small batch sizes. The Smart Scan processes only 3 articles per invocation, and each AI call takes several seconds. The Vector Scan defaults to 10 but also processes them in a serial loop.

## Changes

### 1. Smart Scan (`scan-for-smart-links/index.ts`) -- Parallel Processing + Larger Batch

- Increase `BATCH_SIZE` from 3 to 5
- Replace the serial `for` loop with `Promise.allSettled` to process all articles in the batch concurrently
- This means 5 AI calls happen simultaneously instead of waiting for each one to finish before starting the next
- Expected speedup: ~3-4x per batch (AI latency is the bottleneck and it parallelizes well)

### 2. Vector Scan (`scan-for-semantic-links/index.ts`) -- Parallel Processing + Larger Batch

- Increase `BATCH_SIZE_DEFAULT` from 10 to 20
- Replace the serial `for` loop with `Promise.allSettled` to process articles concurrently
- Expected speedup: ~3-5x per batch (DB calls parallelize efficiently)

### 3. UI Feedback Improvement (`SemanticScanPanel.tsx`)

- Reduce the scan job polling interval from 10s (idle) to 3s while a job is running, so the progress bar updates more frequently and feels snappier

## Technical Details

### Smart Scan Parallel Processing (lines 637-688)

```text
BEFORE (serial):
  for (const emb of embeddings) {
    const suggestions = await processOneArticle(...);
    batchSuggestions += suggestions;
    batchProcessed++;
  }

AFTER (parallel):
  const results = await Promise.allSettled(
    embeddings.map(emb => 
      withTimeout(processOneArticle(...), ARTICLE_TIMEOUT_MS, emb.title)
    )
  );
  for (const result of results) {
    batchProcessed++;
    if (result.status === 'fulfilled') batchSuggestions += result.value;
  }
```

Same pattern applied to the Vector Scan function.

### Polling Interval (`useSemanticLinkScan.ts`)

Change the non-processing refetch interval for `semantic-scan-job-active` from 10000ms to `false` (stop polling when idle), and keep 2000ms during processing.

