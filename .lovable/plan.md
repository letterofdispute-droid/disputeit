

# Fix: Prevent Future Missing Images

## The Problem

During bulk article generation, when Gemini rate-limits and Pixabay fails, the article is saved with `null` image URLs and no record is kept. The backfill system only finds these posts IF the content contains placeholders, and there's no automatic trigger to retry -- you have to manually click "Start Backfill."

## Solution: Automatic Image Retry via pg_cron

### 1. Add a recovery cron job for backfill

Just like the existing `recover_stale_generation_jobs` cron, add a scheduled function that automatically detects posts with missing images and triggers the backfill edge function if needed.

Create a database function `recover_stale_backfill_jobs` that:
- Checks if there are published posts missing images (using the same smart query as `get_next_backfill_post`)
- Checks if there's already an active backfill job running
- If posts need images and no job is running, uses `pg_net` to invoke the backfill edge function automatically

This runs every 30 minutes, so any images that fail during bulk generation will be retried automatically without manual intervention.

### 2. Add retry with longer delays in bulk generation

Currently the retry on 429 waits only 10 seconds. Google's rate limits typically need 60+ seconds to reset. Update the retry logic:
- First attempt: normal
- On 429: wait 30 seconds, retry once
- On second 429: skip (the cron will catch it later)

This gives Gemini more breathing room during bulk runs and reduces the number of posts that end up with missing images in the first place.

### 3. Increase delay between image generations

The current 5-second delay between middle images is too aggressive for large batches. Increase to 8 seconds to stay under Gemini's per-minute rate limits during sustained generation.

## Files to Modify

| File | Change |
|------|--------|
| Migration | Create `recover_stale_backfill_jobs` function + schedule via pg_cron |
| `supabase/functions/bulk-generate-articles/index.ts` | Increase retry delay to 30s; increase inter-image delay to 8s |

## Result

- Missing images from bulk generation will be automatically retried within 30 minutes
- Longer delays reduce rate-limit hits during generation
- No manual "Start Backfill" button needed -- the system self-heals
