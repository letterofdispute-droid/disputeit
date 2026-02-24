

# Fix: OG Image Generation Timeout

## Root Cause

The edge function processes all 28 images sequentially in one HTTP request. Each image takes ~8s to generate + 2s delay = ~10s per image. Total: ~280 seconds, far exceeding the edge function timeout (~60s). The function generated 11 images before the timeout killed it. The UI shows 0/28 because it only refreshes after the function returns - which it never does (timeout error).

**Proof:** Database already has 11 images from the partial run. Logs show successful generation of homepage through do-i-have-a-case before silence.

## Solution

### File 1: `src/components/admin/seo/OgImageManager.tsx` - Batch from frontend

Change `generateAll` to process images in batches of 3 from the frontend:

- Split `missingKeys` into chunks of 3
- Call the edge function for each chunk sequentially
- After each batch completes, invalidate queries to refresh the UI (so user sees progress)
- Track progress with a counter state (e.g., "Generating 6/17...")
- If a batch returns a bail reason (rate limit), stop and show a toast
- Add a `refetchInterval` of 5000ms while `isGenerating` is true so the grid updates live

### File 2: `supabase/functions/generate-og-images/index.ts` - Reduce batch delay

- Reduce the inter-image delay from 2000ms to 1000ms (since batches are now only 3 images, less risk of rate limiting)
- No other changes needed - the function already handles small page arrays correctly

## Technical Details

| File | Change |
|------|--------|
| `src/components/admin/seo/OgImageManager.tsx` | Batch processing loop (chunks of 3), live progress counter, refetchInterval during generation |
| `supabase/functions/generate-og-images/index.ts` | Reduce delay from 2000ms to 1000ms |

No database changes. No new dependencies.

