

# Fix Image Optimizer Stalled Job + Add Recovery

## Problem

The optimization job stalled at 775/5024 images. The self-chain broke (same pattern as the bulk article generator). The root cause is that `handleOptimize` calls `listAllFiles()` on every batch invocation, which lists all 7,145 files across multiple storage API calls. This is slow and can cause the function to timeout before it finishes processing the batch, breaking the chain.

## Fix (Three Parts)

### Part 1: Resume the Stuck Job Immediately

Call the edge function with `{ mode: 'optimize', jobId: 'c708f342-688e-4c65-bfda-9456451b6c38' }` to restart the chain.

### Part 2: Add Stale Detection + Resume Button to ImageOptimizer UI

Apply the same pattern we used for `GenerationProgress`:

- Detect when a job is `optimizing` but `updated_at` is more than 5 minutes old
- Show a "Resume" button instead of the spinner
- The Resume button calls the edge function with `{ mode: 'optimize', jobId }` to restart the chain

**File: `src/components/admin/storage/ImageOptimizer.tsx`**
- Add `isStale` detection logic comparing `updated_at` against a 5-minute threshold
- Show a warning banner with a Resume button when stale
- Add a `handleResume` function that calls the optimize endpoint

### Part 3: Optimize the Edge Function to Avoid Re-listing All Files

The current `handleOptimize` calls `listAllFiles()` (which pages through all 7,145 files) on every single batch of 5 images. This is extremely wasteful and slow.

**File: `supabase/functions/optimize-storage-images/index.ts`**

Change the optimize logic to use `current_offset` directly with the storage list API instead of fetching all files and slicing:

- Instead of `listAllFiles()` then `getOversizedFiles()` then `slice(offset, offset+5)`, use a targeted listing approach
- List files in batches directly from storage using offset/limit, filtering for oversized ones
- This dramatically reduces the work per batch from "list 7000+ files" to "list ~50 files and pick 5 oversized ones"

Alternatively, a simpler approach: store the list of oversized file paths in the job record during the scan phase, then during optimization just read the next batch of paths from that stored list. This avoids re-scanning entirely.

**Chosen approach**: Store oversized file paths as a JSONB array in a new `file_list` column on `image_optimization_jobs` during the scan. During optimization, read `file_list[offset:offset+batch_size]` directly -- no re-listing needed.

### Database Migration

Add a `file_list` column to `image_optimization_jobs`:

```sql
ALTER TABLE image_optimization_jobs 
ADD COLUMN IF NOT EXISTS file_list jsonb DEFAULT '[]'::jsonb;
```

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/optimize-storage-images/index.ts` | Store oversized paths during scan, read from stored list during optimize (no re-listing), redeploy |
| `src/components/admin/storage/ImageOptimizer.tsx` | Add stale detection + Resume button |
| Database migration | Add `file_list` column to `image_optimization_jobs` |

### Flow After Fix

```text
SCAN:
  1. List all files (once)
  2. Filter oversized (>300KB, not -opt.jpg)
  3. Store paths in file_list column
  4. Update job status to 'scanned'

OPTIMIZE:
  1. Read file_list from job record
  2. Slice file_list[offset : offset+5] for current batch
  3. Process batch (download, compress, upload in-place)
  4. Update offset, self-chain to next batch
  -- No more listAllFiles() calls during optimization
```
