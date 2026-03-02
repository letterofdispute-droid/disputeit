

# Generate Unique SEO Metadata & Featured Images for All 889 Pages

## Scale
889 pages need unique `meta_title`, `meta_description`, and `featured_image_url`. Each requires an individual AI call for meta content and a Pixabay stock photo search for a realistic image.

## Architecture

### 1. New edge function: `backfill-page-seo`

Accepts a batch of page IDs (max 5 per call to stay within timeout). For each page:

1. **AI meta generation** — Sends the page's `title`, `slug`, and `page_group` to Gemini Flash Lite. Prompt instructs it to write a unique, compelling meta title (≤60 chars) and meta description (≤155 chars) tailored to the specific topic. No patterns, no templates — the AI writes each one from scratch based on the page's actual subject matter.

2. **Pixabay image search** — Extracts visual keywords from the title (e.g., "Alabama Housing Rights" → "apartment tenant Alabama") and fetches a relevant horizontal stock photo. Stores the `largeImageURL` as `featured_image_url`.

3. **Database update** — Sets `meta_title`, `meta_description`, `featured_image_url` on the page row.

Returns progress (how many succeeded/failed) so the frontend can track it.

### 2. Admin UI: Batch SEO backfill controls

Add a "Generate SEO" button to AdminPages that:
- Queries all pages in the selected `page_group` filter where `meta_title IS NULL`
- Processes them in sequential chunks of 5 (calling the edge function repeatedly)
- Shows a progress bar: "Processing 45/714 state-rights pages..."
- Allows cancellation mid-batch
- Auto-refreshes the table when done

### 3. Processing order (recommended)
Start with smaller groups first to verify quality before committing to the 714 state-rights pages:
1. Auth (7) — simple, fast
2. Guides (14) — unique topics
3. Templates (103) — category/subcategory pages
4. Small Claims (51) — per-state
5. State Rights (714) — largest batch, run last

### Files changed
- **`supabase/functions/backfill-page-seo/index.ts`** — New edge function
- **`src/pages/admin/AdminPages.tsx`** — Add "Generate SEO" button with progress tracking
- **`src/hooks/usePageSeoBackfill.ts`** — New hook for batch processing logic

### Cost & time estimate
~889 AI calls (Gemini Flash Lite, cheap) + ~889 Pixabay searches. At ~2 seconds per page in batches of 5, the full run takes roughly 6-7 minutes. Pixabay is free (with API key already configured). AI costs are minimal with Flash Lite.

