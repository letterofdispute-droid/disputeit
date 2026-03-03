
Goal: migrate all remaining tables (including the 95MB `blog_posts` dataset) reliably without requiring you to run local scripts.

What I found
- The migration function is available and works when called with table-specific query params.
- A full “all tables at once” call is timing out because it tries to process too much in one request.
- Your large `blog_posts` table size is expected; it just requires strict chunking + resume.

Plan A (do this first, no code changes required)
1. Run chunked migration table-by-table using the existing migration endpoint with:
   - `table=<name>`
   - `offset=<resume point>`
   - `max_batches=5`
2. Process in dependency order:
   - `blog_posts` → `article_embeddings` → `content_queue` → `keyword_targets` → `link_suggestions`
3. Keep resuming from `next_offset` until it returns `null` for each table.
4. If any request fails/timeouts, retry the same offset (safe because writes are idempotent via upsert).
5. After those complete, run a final pass for any remaining small tables not yet synced.

Why this should work for 95MB
- `blog_posts` uses the small internal batch size (50 rows).
- With `max_batches=5`, each request handles about 250 rows, keeping each call small enough for gateway limits.
- Estimated calls for `blog_posts`: ~28 total (6,841 / 250).

Plan B (fallback if Plan A still unstable)
1. Harden migration function to support:
   - POST body params (so orchestration tools can pass options reliably)
   - per-table `batch_size_override`
   - execution time budget (stop early, always return clean checkpoint)
2. Add a lightweight “status/count” mode to compare source vs destination counts per table.
3. Resume automatically until each table matches.

Technical details
- Root issue: request duration/size, not data corruption.
- Current batching config:
  - standard tables: 500 rows/batch
  - heavy tables (`blog_posts`, `article_embeddings`, `link_suggestions`, `content_queue`): 50 rows/batch
- Safe resume model:
  - invoke with `offset`
  - read response `next_offset`
  - continue until `next_offset = null`
- `user_roles` remains special because it depends on authentication users existing in the target backend.

Expected outcome
- Full migration completion for all content tables, including the large `blog_posts` dataset, via resumable chunked execution.
- No local terminal work needed from you.
