
Root cause identified: this is a timeout failure, not auth.

- Backend analytics show `OPTIONS 200` and `POST 504` for `backfill-page-seo`, with execution time ~150s (platform timeout).
- That matches your UI symptom: each batch of 5 is marked failed, and browser reports `Failed to fetch`.

Implementation plan

1) Make each backend request finish well under timeout
- Update `supabase/functions/backfill-page-seo/index.ts`:
  - Reduce max accepted `page_ids` from `1-5` to `1-2`.
  - Add explicit per-call timeouts using `AbortController`:
    - AI request timeout (e.g. 20–25s)
    - Pixabay request timeout (e.g. 8–10s)
  - Keep per-page try/catch, but classify errors clearly (`ai_timeout`, `ai_429`, `pixabay_timeout`, `db_error`, etc.).
  - Return structured response:
    - `succeeded`, `failed`, `errors` (with page id + reason), and optional `duration_ms`.

2) Align frontend batching with timeout-safe backend behavior
- Update `src/hooks/usePageSeoBackfill.ts`:
  - Change `BATCH_SIZE` from `5` to `1` (safest) or `2` (balanced).
  - Keep sequential processing to avoid rate-limit bursts.
  - Increase inter-batch delay slightly (e.g. 1200–1500ms).
  - Capture invoke errors explicitly (instead of silent catch) and attach error text to state.
  - Expand page selection criteria to include missing any required SEO asset:
    - `meta_title IS NULL OR meta_description IS NULL OR featured_image_url IS NULL`
  - Keep existing pagination loop with `.range(...)` (already good for high-volume data).

3) Improve admin observability so failures are actionable
- Update `src/pages/admin/AdminPages.tsx`:
  - In progress panel, show last error reason and count by type (timeout/rate-limit/other).
  - Final toast should include a short failure summary (not just failed count), so you can see why.
  - Keep cancel behavior unchanged.

4) Preserve content quality while filling only missing fields
- In function logic:
  - Generate unique AI meta only when title/description missing.
  - If only image is missing, skip full SEO generation and fetch a realistic topical image based on page topic.
  - Avoid overwriting existing non-null metadata unless explicitly requested.

Technical details

- Files to update:
  - `supabase/functions/backfill-page-seo/index.ts`
  - `src/hooks/usePageSeoBackfill.ts`
  - `src/pages/admin/AdminPages.tsx`
- No schema or policy changes required.
- Secrets already present for required providers, so no secret setup blocker.
- This directly addresses the current failure loop (`504 -> Failed to fetch`) and makes runs stable for all 889+ pages.

Validation plan

1. Run `Guides` first (14 pages).
   - Expected: no `Failed to fetch`, no batch-wide hard failures from timeout.
2. Confirm with database check:
   - Missing count for guide pages should drop to zero for `meta_title`, `meta_description`, `featured_image_url`.
3. Then run larger groups in order:
   - `auth -> template -> small-claims -> state-rights`.
4. Spot-check generated results for uniqueness and topical image realism on random samples per group.
