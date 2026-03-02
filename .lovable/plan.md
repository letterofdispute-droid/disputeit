

# Fix SEO Backfill: Add Retries and Use Lovable AI for Images

## Problems Identified

1. **`invoke_error` / `Failed to fetch`**: The edge function takes 7-10s per page (AI meta + image generation + upload). Some requests timeout at the network level. Unlike `useContentQueue` which retries twice on `Failed to fetch`, `usePageSeoBackfill` has zero retry logic -- it just counts the failure and moves on.

2. **Speed**: ~10s per page is inherent to image generation. With 103 pages, that's ~17 minutes. Cannot be reduced much, but reliability can be improved.

3. **Image generation uses a separate Google API key**: The `backfill-page-seo` function calls the Google Gemini API directly via `GOOGLE_GEMINI_API_KEY`. This can be replaced with the Lovable AI gateway (`google/gemini-2.5-flash-image`) which is already configured and potentially more reliable.

## Plan

### 1. Add retry logic to `usePageSeoBackfill` (frontend)
**File:** `src/hooks/usePageSeoBackfill.ts`

Add a 2-attempt retry loop (matching the pattern in `useContentQueue`):
- On `Failed to fetch` or invoke error, wait 3 seconds and retry once
- Only count as failed after both attempts fail

### 2. Switch image generation to Lovable AI gateway (backend)
**File:** `supabase/functions/backfill-page-seo/index.ts`

Replace the direct Google Gemini API call in `generateImageWithGoogle()` with a call to `https://ai.gateway.lovable.dev/v1/chat/completions` using `google/gemini-2.5-flash-image` model and `LOVABLE_API_KEY`. This:
- Eliminates the dependency on `GOOGLE_GEMINI_API_KEY`
- Uses the same gateway as all other AI calls
- Simplifies the shared `googleImageGen.ts` dependency

### 3. Update shared image helper
**File:** `supabase/functions/_shared/googleImageGen.ts`

Add a new function `generateImageWithLovable()` that calls the Lovable AI gateway for image generation, returning the same `GoogleImageResult` format. The existing `imageResultToRawBuffer` helper remains unchanged.

## Files to edit
- `src/hooks/usePageSeoBackfill.ts` -- add retry loop
- `supabase/functions/backfill-page-seo/index.ts` -- switch to Lovable AI gateway for images
- `supabase/functions/_shared/googleImageGen.ts` -- add Lovable AI gateway image function

