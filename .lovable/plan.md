

# Replace Pixabay with AI-Generated Images in SEO Backfill

## Problem
The `backfill-page-seo` edge function currently uses Pixabay stock photos for featured images. You want unique, AI-generated images that realistically represent each page's topic.

## Approach
Use the existing `googleImageGen.ts` shared helper (which calls Google Gemini image generation directly using the already-configured `GOOGLE_GEMINI_API_KEY` secret) to generate a unique image per page, then upload it to the existing public `blog-images` storage bucket.

## Changes

### 1. `supabase/functions/backfill-page-seo/index.ts`
- Remove all Pixabay logic (lines 209-238, the `PIXABAY_API_KEY` reference on line 81)
- Import `generateImageWithGoogle`, `imageResultToRawBuffer`, `shouldBailOut` from `../_shared/googleImageGen.ts`
- When `needsImage`:
  1. Build a prompt: "Create a realistic, professional 16:9 photograph representing [page title]. The image should be suitable as a blog featured image. No text overlay."
  2. Call `generateImageWithGoogle(prompt, GOOGLE_GEMINI_API_KEY)`
  3. Convert result to buffer via `imageResultToRawBuffer`
  4. Upload to `blog-images` bucket at path `pages/{page.slug}.{ext}` using service role client
  5. Get public URL, store as `featured_image_url`
- Handle `shouldBailOut` errors (rate limit / credit exhaustion) to set `bailReason` and stop the batch
- Add a 30s `AbortController` timeout wrapper around the image generation call
- Change `image_keywords` in the AI tool call to `image_prompt` — a descriptive visual scene prompt instead of search keywords

### 2. Reduce batch size to 1
Since image generation is slower than Pixabay lookup, keep `page_ids` max at 1 to stay well under the edge function timeout. Update validation from `> 2` to `> 1`.

### 3. `src/hooks/usePageSeoBackfill.ts`
- Change `BATCH_SIZE` from 2 to 1
- Increase `INTER_BATCH_DELAY` to 2000ms (image gen is heavier, helps avoid rate limits)

### Technical note
- `GOOGLE_GEMINI_API_KEY` is already configured as a secret
- The `blog-images` bucket is public, so the public URL works directly as `featured_image_url`
- The shared helper already handles error categorization (rate limit, credit exhaustion, AI error)
- Image generation adds ~5-15s per page, so processing 889 pages at 1/batch with 2s delay will take ~2-4 hours total

