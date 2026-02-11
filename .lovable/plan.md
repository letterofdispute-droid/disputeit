

# Bulk Image Optimization -- Compress Existing Blog Images

## Overview

Create a new edge function and admin UI to scan the `blog-images` storage bucket, identify oversized images, compress them server-side, replace the originals, and update all database references. This will reclaim significant storage space from the ~6,000+ uncompressed AI-generated images.

## Architecture

### 1. New Edge Function: `optimize-storage-images`

**File: `supabase/functions/optimize-storage-images/index.ts`**

This function handles two operations:

**`scan` mode** -- Lists all files in `blog-images` bucket, returns file metadata (name, size) so the UI can display totals and identify large files.

**`optimize` mode** -- Processes images in batches:
- Download the original from storage
- Decode with `imagescript` (Deno WASM library)
- Resize to max 1200px width, encode as JPEG at 80% quality
- Upload the compressed version with a `-opt.jpg` suffix
- Update all `blog_posts` columns (`featured_image_url`, `middle_image_1_url`, `middle_image_2_url`) that reference the old URL
- Also update `category_images` table references if applicable
- Track results (original size, new size, savings)

**`cleanup` mode** -- After optimization is verified, delete the original oversized files from storage.

### 2. New Admin UI Component: `ImageOptimizer`

**File: `src/components/admin/storage/ImageOptimizer.tsx`**

A card-based UI added to the Admin Settings page with:
- **Scan button** -- Calls the edge function in scan mode, shows total storage used, number of oversized images (> 500KB), and potential savings
- **Optimize button** -- Starts batch compression with a progress bar showing processed/total count and cumulative savings
- **Cleanup button** -- Only enabled after optimization completes; deletes originals and shows final savings
- Stats display: total images, oversized count, total size, estimated savings

### 3. Add to Admin Settings Page

**File: `src/pages/admin/AdminSettings.tsx`**

Add the `ImageOptimizer` component as a new card in the settings page, between the existing cards and the Data Export section.

### 4. Future-proof: Compress New Images Too

**File: `supabase/functions/_shared/googleImageGen.ts`**

Update `imageResultToBuffer()` to compress images before returning. Use Canvas API via `imagescript` to resize to 1200px max width and encode as JPEG at 80% quality. This ensures all future AI-generated images are already optimized.

### 5. Config Update

**File: `supabase/config.toml`**

Add entry for the new edge function with `verify_jwt = false`.

## Technical Details

### Edge Function Flow (optimize mode)

```text
1. List files in blog-images bucket (paginated, 100 at a time)
2. Filter to files > 500KB (skip already-optimized ones ending in -opt.jpg)
3. For each file:
   a. Download from storage
   b. Decode image buffer
   c. Resize if width > 1200px
   d. Encode as JPEG at quality 80
   e. Upload compressed version
   f. Update blog_posts URLs (featured_image_url, middle_image_1_url, middle_image_2_url)
   g. Update category_images URLs if matched
   h. Log: original size -> new size
4. Return summary: processed count, total saved bytes, errors
```

### Database URL Updates

When replacing an image, the function will:
- Query `blog_posts` for any row where `featured_image_url`, `middle_image_1_url`, or `middle_image_2_url` contains the old filename
- Update those columns with the new optimized URL
- Do the same for `category_images.image_url`, `thumbnail_url`, `large_url`

### Safety Measures

- Process in batches of 20 to avoid timeouts
- Skip files already under 500KB
- Skip files with `-opt` suffix (already processed)
- Keep originals until explicit cleanup step
- The cleanup step verifies the optimized version exists before deleting the original
- All operations use service role key for storage access

### UI States

1. **Initial** -- Show "Scan Storage" button
2. **Scanned** -- Show stats (total images, oversized count, total size, potential savings), "Optimize" button
3. **Optimizing** -- Progress bar with count and cumulative savings
4. **Optimized** -- Show results, "Cleanup Originals" button
5. **Cleaned** -- Final summary with total space reclaimed

