

# Fix: Robust Image Backfill with Progress Tracking

## Root Causes Found

1. **CPU timeout**: The `imageResultToBuffer` function imports `imagescript` (a heavy image processing library) to resize and compress images. This alone can exhaust the CPU budget before any image is even uploaded.
2. **Infinite loop**: Posts with NULL `middle_image_1_url` or `middle_image_2_url` but NO placeholder in their content are fetched every invocation, skipped, and fetched again -- forever.
3. **Cascading timeout**: The self-chain `fetch()` call awaits the full response. If the chained invocation also times out, it cascades back.

## Solution

### 1. Database: Add `backfill_jobs` table for progress tracking

Create a simple tracking table so the UI can show real progress:

```sql
CREATE TABLE backfill_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, complete, paused, failed
  total_images INTEGER DEFAULT 0,
  processed_images INTEGER DEFAULT 0,
  failed_images INTEGER DEFAULT 0,
  last_post_slug TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Edge Function: Complete rewrite with fixes

**Remove `imagescript` compression** -- upload raw base64 as PNG/JPEG directly. Gemini already returns reasonably sized images, and the compression was the main CPU killer.

**Fix the query** -- exclude posts that will be skipped by filtering on content placeholders in the SQL:

```sql
-- Only fetch posts that ACTUALLY need images
SELECT * FROM blog_posts
WHERE status = 'published'
  AND (
    featured_image_url IS NULL
    OR (middle_image_1_url IS NULL AND content LIKE '%MIDDLE_IMAGE_1%')
    OR (middle_image_2_url IS NULL AND content LIKE '%MIDDLE_IMAGE_2%')
  )
ORDER BY created_at DESC
LIMIT 1
```

**Fire-and-forget self-chain** -- don't await the chained call. Treat 504 as success per the project's established pattern.

**Add logging at every step**:
- `[BACKFILL] Starting batch, job={id}`
- `[BACKFILL] Processing post: {slug}, needs: featured={bool}, mid1={bool}, mid2={bool}`
- `[BACKFILL] Generated {type} for {slug} ({size}KB)`
- `[BACKFILL] Upload complete: {url}`
- `[BACKFILL] Batch done: {processed} images, {remaining} remaining`
- `[BACKFILL] Chain triggered for next batch`

**Update `backfill_jobs` row** after each post with atomic increments.

### 3. UI Component: Real progress from database

Update `ImageBackfillCard` to:
- Create a `backfill_jobs` row when starting
- Poll the `backfill_jobs` table directly (not the edge function) for progress
- Show: "Processing... 42/1,173 images (3.6%) -- Last: dispute-letter-template-slug"
- Show error count and last error if any

### Per-post processing flow (simplified)

```text
1. Fetch 1 post that actually needs images (smart SQL filter)
2. For each missing image type:
   a. Call Gemini API
   b. Convert base64 to raw buffer (NO imagescript)
   c. Upload to storage
   d. Update backfill_jobs progress (atomic increment)
3. Update blog_posts with new URLs
4. Fire-and-forget self-chain to next batch
5. Return response immediately
```

## Files to Create/Modify

| File | Change |
|------|--------|
| Migration | Create `backfill_jobs` table |
| `supabase/functions/backfill-blog-images/index.ts` | Full rewrite: remove imagescript, fix query, fire-and-forget chain, add logging, track progress in DB |
| `supabase/functions/_shared/googleImageGen.ts` | Add a lightweight `imageResultToRawBuffer` function that skips compression |
| `src/components/admin/blog/ImageBackfillCard.tsx` | Poll `backfill_jobs` table for real progress, show detailed status |

