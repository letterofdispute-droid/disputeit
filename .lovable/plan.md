

# Fix: Backfill All Missing Images (No Pixabay)

## Problem

- 467 articles missing featured images
- 470 articles missing middle image 1
- 1,608 articles missing middle image 2
- Pixabay quality is poor -- remove it entirely

## Changes

### 1. Rewrite `backfill-blog-images/index.ts`

- **Remove** all Pixabay fallback code (the `fetchPixabayFallback` function and its usage)
- **Add middle image generation**: For each post, generate up to 3 images (featured, middle_1, middle_2) if they are NULL
- Query posts where ANY image column is NULL (not just featured)
- Generate each missing image with Gemini using different prompts:
  - Featured: "realistic photograph" prompt (existing)
  - Middle 1: "detailed scene or process" prompt with different style
  - Middle 2: "supporting visual or infographic-style" prompt
- Update all three columns + their alt text columns in one DB update per post
- Keep the 3s delay between each image (not per post), so ~9s per post if all 3 are missing
- If Gemini fails (non-bail error), skip that image and continue to the next -- no Pixabay fallback
- Bail on rate limit / quota exhaustion as before

### 2. Update status mode

Return counts for all three image types so the UI can show a more complete picture:

```json
{
  "missing_featured": 467,
  "missing_middle1": 470,
  "missing_middle2": 1608,
  "total_missing": 2545,
  "status": "idle"
}
```

### 3. Update query to find posts needing images

Instead of only `featured_image_url IS NULL`, query for posts where ANY of the three image columns is NULL:

```sql
SELECT id, title, slug, category_slug, 
       featured_image_url, middle_image_1_url, middle_image_2_url
FROM blog_posts
WHERE status = 'published'
  AND (featured_image_url IS NULL 
    OR middle_image_1_url IS NULL 
    OR middle_image_2_url IS NULL)
```

### 4. Update `ImageBackfillCard.tsx`

- Show total missing count across all three types (e.g., "2,545 missing images across 470 articles")
- No other UI changes needed

## Technical Details

### Per-post processing flow

```text
For each post:
  1. If featured_image_url IS NULL -> generate featured image (3s delay)
  2. If middle_image_1_url IS NULL -> generate middle image 1 (3s delay)
  3. If middle_image_2_url IS NULL -> generate middle image 2 (3s delay)
  4. Update DB with all generated URLs in one call
```

### Batch size adjustment

Since each post may need up to 3 images (9s+ per post), reduce batch size from 5 to 3 posts per invocation to stay within edge function timeout limits.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/backfill-blog-images/index.ts` | Remove Pixabay, add middle image generation, update query |
| `src/components/admin/blog/ImageBackfillCard.tsx` | Show total missing count across all image types |

