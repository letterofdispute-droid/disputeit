

# Fix: Switch Page SEO Image Generation to Direct Google API

## Problem
The `backfill-page-seo` function uses `generateImageWithLovable()` (Lovable AI gateway proxy) for images, while all blog functions (`bulk-generate-articles`, `backfill-blog-images`, `generate-blog-image`) use `generateImageWithGoogle()` (direct Google API). The gateway adds several seconds of latency per request.

## Fix
**File:** `supabase/functions/backfill-page-seo/index.ts`

Switch from `generateImageWithLovable` to `generateImageWithGoogle`, using `GOOGLE_GEMINI_API_KEY` (already configured as a secret, used by all other image functions). This is a ~3 line change:

1. Change import: `generateImageWithLovable` → `generateImageWithGoogle`
2. Read `GOOGLE_GEMINI_API_KEY` instead of using `LOVABLE_API_KEY` for images
3. Call `generateImageWithGoogle(imagePrompt, geminiKey)` instead of `generateImageWithLovable(imagePrompt, LOVABLE_API_KEY)`

Keep using `LOVABLE_API_KEY` for the text meta generation (Gemini Flash Lite) since that's fast already. Only the image call changes.

