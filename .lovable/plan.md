# Upgrade Image Storage Optimizer: In-Place Optimization

## Problem

The current optimizer creates `-opt.jpg` copies alongside originals, then requires a separate "Cleanup" step to delete originals. If cleanup isn't run, every new scan shows the same oversized count. This is confusing and wasteful.

Additionally, newly AI-generated images are already compressed JPEGs (via the image generation pipeline), so only legacy images need optimization.

## Solution: In-Place Replacement

Instead of the two-step copy-then-delete workflow, the optimizer will **replace files in-place** -- overwrite the original with the optimized version. This eliminates the cleanup step entirely.

### Changes to Edge Function (`supabase/functions/optimize-storage-images/index.ts`)

1. **Lower threshold from 500KB to 300KB** -- files under 300KB are considered acceptable
2. **In-place optimization** -- download the file, compress it, upload back to the **same path** with `upsert: true`. No more `-opt.jpg` suffix, no more cleanup step
3. **Remove cleanup mode entirely** -- no longer needed since originals are replaced
4. **Exclude already-optimized files** -- track optimized paths in the job metadata so re-runs within the same scan don't re-process. Also skip files that are already JPEG and under 300KB
5. **Better scan filtering** -- only count files above 300KB that aren't already small JPEGs

### Changes to UI Component (`src/components/admin/storage/ImageOptimizer.tsx`)

1. Update threshold display text from ">500KB" to ">300KB"
2. Remove the "Delete Originals" / cleanup button and related states
3. After optimization completes, show a simpler "Done" message (no cleanup step needed)
4. Update description text to reflect the new in-place behavior

### Scan Logic (Updated)

```text
For each file in storage:
  - Skip if size <= 300KB (already acceptable)
  - Skip if name ends with '-opt.jpg' (legacy optimized copy)
  - Count everything else as "oversized" / needs optimization
```

### Optimize Logic (Updated)

```text
For each oversized file:
  1. Download it
  2. Resize to max 1200px width
  3. Encode as JPEG at 80% quality
  4. If compressed size < original size:
     - Upload compressed version to SAME PATH (overwrite)
     - No DB reference updates needed (URL stays the same)
  5. If compressed size >= original: skip (already optimal)
```

Since the URL doesn't change (same path, overwritten in place), there is **no need to update blog_posts or category_images references**. This is a major simplification.

### Legacy `-opt.jpg` Cleanup

The scan will also count any lingering `-opt.jpg` files that have a corresponding original still present. During optimization, if an `-opt.jpg` exists alongside an original, the optimizer will delete the `-opt.jpg` copy (since the original will now be optimized in-place).

### Files to Modify


| File                                                  | Change                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `supabase/functions/optimize-storage-images/index.ts` | Lower threshold, in-place overwrite, remove cleanup mode, simplify DB updates |
| `src/components/admin/storage/ImageOptimizer.tsx`     | Remove cleanup UI, update threshold labels, simplify flow                     |
