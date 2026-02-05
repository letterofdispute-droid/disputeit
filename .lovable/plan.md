
# Fix: "Generate All Queued" Returns 0 Articles

## Problem Identified

When clicking "Generate All Queued" in ClusterPlanner, the system immediately returns "Batch generation complete - Generated 0 articles, 0 failed" without processing anything.

## Root Cause

The recent batch chaining implementation broke the flow:

1. **ClusterPlanner.tsx** (line 113-119) calls:
   ```typescript
   bulkGenerate({
     planId: existingPlan.id,
     batchSize: 10,
   });
   ```
   Notice: **No `queueItemIds` is passed**

2. **useContentQueue.ts** mutation (line 159-161):
   ```typescript
   const itemIds = params.queueItemIds || [];  // Empty array!
   const chunks = chunkArray(itemIds, MAX_BATCH_SIZE);  // Empty chunks!
   const totalBatches = chunks.length;  // 0 batches!
   ```

3. The `for` loop never executes (0 iterations), so:
   ```typescript
   return { success: true, succeeded: 0, failed: 0, totalBatches: 0 }
   ```

## Solution

Modify `handleGenerateAll` in ClusterPlanner to explicitly pass the queued item IDs:

```typescript
const handleGenerateAll = () => {
  if (!existingPlan) return;
  
  // Get IDs of all queued items for this plan
  const queuedIds = planQueueItems
    .filter(item => item.status === 'queued')
    .map(item => item.id);
  
  if (queuedIds.length === 0) return;
  
  bulkGenerate({
    planId: existingPlan.id,
    queueItemIds: queuedIds,  // Now explicitly passing the IDs
    batchSize: queuedIds.length,
  });
};
```

This ensures the mutation receives the actual item IDs to process and properly chunks them.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/seo/ClusterPlanner.tsx` | Update `handleGenerateAll` to pass `queueItemIds` |

---

## Validation Checklist

After fix:
- `handleGenerateAll` extracts queued item IDs from `planQueueItems`
- Those IDs are passed to `bulkGenerate({ queueItemIds: [...] })`
- The mutation chunks these IDs and processes them in batches of 3
- Progress UI shows "Batch 1 of N" correctly
- Toast shows actual generated count

---

## Expected Flow After Fix

```text
User clicks "Generate All Queued (5)"
    ↓
handleGenerateAll extracts 5 queued IDs
    ↓
bulkGenerate({ queueItemIds: [id1, id2, id3, id4, id5] })
    ↓
chunkArray → [[id1, id2, id3], [id4, id5]]
    ↓
Process batch 1/2 → 3 articles
Process batch 2/2 → 2 articles
    ↓
Toast: "Generated 5 articles (2 batches)"
```
