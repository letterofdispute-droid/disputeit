

## Investigation

The `gsc_index_status` table is empty — the sitemaps upsert never succeeded. No error logs were captured, which means either:
1. The Sitemaps API returned a non-200 and the error log was flushed before capture
2. The API returned 200 but with an empty sitemap list (no sitemaps submitted to GSC)
3. The upsert silently failed

## Plan

### 1. Add diagnostic logging to `fetch-gsc-data`
- Log the sitemaps API response status and body regardless of success/failure
- Log the upsert result (success or error) for `gsc_index_status`
- Log `indexData` totals before returning

### 2. Handle empty sitemaps gracefully
- If no sitemaps are registered in GSC, fall back to counting published `blog_posts` as the "indexed" proxy, or show a helpful message in the UI instead of "—"
- Still upsert `gsc_index_status` even when counts are 0 so the UI shows "0" instead of "—"

### 3. Fix silent upsert failure
- The upsert on line 211 doesn't check for errors — add error handling so failures are logged

### Files changed
- `supabase/functions/fetch-gsc-data/index.ts`: Add logging, error handling on upsert, upsert even when sitemaps are empty

