

# Fix: Backfill Missing Blog Images + Harden Image Pipeline

## Problem

467 published articles have no featured image (`featured_image_url = NULL`). These were generated during a bulk run where Gemini image generation hit quota/rate limits and the Pixabay fallback also failed. The articles were then bulk-published without images.

## Solution: Two Parts

### Part 1: Backfill Edge Function

Create a new edge function `backfill-blog-images` that:

1. Queries `blog_posts` where `featured_image_url IS NULL` and `status = 'published'` (in batches of 5)
2. For each post, attempts Gemini image generation first, then Pixabay fallback
3. Updates the `featured_image_url` and `featured_image_alt` columns
4. Self-chains to process the next batch (same pattern as the optimizer)
5. Includes rate-limit delays (3s between images) to avoid hitting Gemini quotas again
6. Tracks progress in a simple status response

The function will be callable from the admin settings page.

### Part 2: Admin UI - Backfill Button

Add a "Backfill Missing Images" card to the admin settings page (or a button on the blog management page) showing:
- Count of articles missing images
- A button to start the backfill
- Progress indicator while running

### Part 3: Harden Bulk Generator (Future Batches)

Modify `bulk-generate-articles/index.ts` to add longer delays between image generation attempts (5s instead of 3s) and add a retry with exponential backoff for Gemini 429 errors before falling to Pixabay. This reduces the chance of quota exhaustion during bulk runs.

## Technical Details

### New file: `supabase/functions/backfill-blog-images/index.ts`

- Accepts `{ mode: 'status' | 'start' }` 
- On `start`: queries up to 5 posts with null images, generates images, updates DB, self-chains
- Uses existing `generateImageWithGoogle` from `_shared/googleImageGen.ts` 
- Falls back to Pixabay if Gemini fails
- 3-second delay between each image to respect rate limits
- Returns `{ processed, remaining, status }` for the UI

### Modified file: `src/pages/admin/AdminSettings.tsx` (or wherever the admin settings live)

- Add a card showing "X articles missing images" with a "Generate Missing Images" button
- Poll for progress while running

### Modified file: `supabase/functions/bulk-generate-articles/index.ts`

- Increase delay between image generations from 3s to 5s
- Add a single retry with 10s backoff on Gemini 429 before falling to Pixabay
- This makes future bulk runs more resilient to rate limits

## Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/backfill-blog-images/index.ts` | New edge function to backfill missing images |
| `src/components/admin/blog/ImageBackfillCard.tsx` | New UI component for triggering and monitoring backfill |
| `src/pages/admin/AdminBlog.tsx` | Add ImageBackfillCard to the blog management page |
| `supabase/functions/bulk-generate-articles/index.ts` | Increase image generation delays and add retry logic |
