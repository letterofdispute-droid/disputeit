

# Fix: Embedding Job Crashes After ~380 Articles

## Problem

The "Generate All" embedding job failed after processing 380 out of 4,627 articles. The root cause is a **URL length overflow**.

The function excludes already-processed articles using a `NOT IN (uuid1, uuid2, ...)` filter in the query string. After ~380 articles, the list of UUIDs exceeds the maximum URL length, causing a network-level `TypeError`.

## Solution

Replace the growing exclusion list approach with an **offset-based approach** using `processed_items` as a cursor. Instead of tracking every processed ID in an array and excluding them via URL params, we'll:

1. Query articles ordered deterministically (by `id`)
2. Use `.range(offset, offset + BATCH_SIZE - 1)` to paginate through them
3. Track progress via the existing `processed_items` counter instead of the `processed_ids` array

This keeps the query URL constant-size regardless of how many articles have been processed.

## Technical Changes

**File: `supabase/functions/generate-embeddings/index.ts`**

In the `processNextBatch` function (around line 200-394):

- Remove the `processed_ids` / `failed_ids` array-based exclusion logic
- Add deterministic ordering: `.order('id', { ascending: true })`
- Use `.range(job.processed_items, job.processed_items + BATCH_SIZE - 1)` for pagination
- Track failed articles separately (keep failed_ids for retry, but don't use it in the query filter)
- Update progress by incrementing `processed_items` and `failed_items` counters atomically

**Key change in query logic:**

```text
BEFORE (breaks at ~380 items):
  query.not('id', 'in', `(${hugeListOfIds})`)

AFTER (works for any volume):
  query.order('id', { ascending: true })
       .range(offset, offset + BATCH_SIZE - 1)
```

- The `failed_ids` array is still maintained for the retry feature, but is no longer used in the main query filter
- The completion check becomes: `processed_items + failed_items >= total_items`

## Scope
- 1 edge function modified (`generate-embeddings/index.ts`)
- No database schema changes needed
- Existing retry logic continues to work unchanged

