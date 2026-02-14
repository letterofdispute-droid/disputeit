

# Bulletproof Link Discovery (scan-for-semantic-links)

## Issues Found (5 critical, 2 moderate)

### CRITICAL

1. **Bidirectional scan fetches ALL 4,627 embeddings into memory** (lines 306-311). Each article pulls the entire table including 1536-dimension vectors, then loops through each one making individual DB queries. This is ~46,000 DB round-trips per batch of 10. Guaranteed timeout.

2. **Self-chain is NOT in a try/finally block**. If the processing loop throws, the self-chain on line 382 never fires and the job stalls permanently with no way to resume.

3. **Auth uses `getUser()` (line 75)** which is incompatible with this environment. Must use `getClaims()` + `sub` field (the established pattern).

4. **`anchor_source` constraint violation**. The code inserts `'semantic'` and `'semantic-reverse'` but the database CHECK constraint only allows: `primary_keyword`, `secondary_keyword`, `contextual`, `ai_suggested`, `mandatory`. Every insert with these values fails silently. This is already visible in the edge function logs.

5. **No pg_cron recovery**. If the self-chain fails (network blip, cold start timeout), the job sits in "processing" forever. Every other bulk job in the system has a cron-based safety net.

### MODERATE

6. **No per-article timeout**. A single slow `match_semantic_links` RPC call could consume the entire function timeout.

7. **Duplicate suggestion inserts not handled gracefully**. Re-running a scan on already-scanned articles will attempt duplicate inserts.

## Fixes

### Fix 1: Replace bidirectional with reverse RPC call

Instead of fetching all embeddings and computing cosine similarity in JavaScript, call `match_semantic_links` with the source article's embedding but searching for articles that should link TO it. One RPC call replaces 4,627 individual queries.

```text
BEFORE: fetch all 4,627 rows with vectors -> loop -> individual query each -> cosine in JS
AFTER:  1 RPC call per source article (runs in Postgres using pgvector index)
```

### Fix 2: try/finally for self-chain

Wrap the entire batch processing in try/finally so the self-chain ALWAYS fires, even if an article crashes the batch.

### Fix 3: Fix auth to use getClaims()

Replace `getUser()` with `getClaims(token)` and extract user ID from `claims.sub`.

### Fix 4: Fix anchor_source values

Add `'semantic'` and `'semantic-reverse'` to the database CHECK constraint via migration. This matches what the code actually produces.

### Fix 5: Add pg_cron recovery

Create `recover_stale_semantic_scan_jobs()` function (same pattern as `recover_stale_generation_jobs`). Schedule via pg_cron every 2 minutes. Detects jobs stuck in "processing" for 5+ minutes and re-invokes the edge function.

### Fix 6: Per-article timeout wrapper

Add a `withTimeout()` helper (same pattern as `optimize-storage-images`). Each article gets max 30 seconds; if it times out, skip it and continue the batch.

### Fix 7: Upsert-style duplicate prevention

Before inserting suggestions, delete any existing pending suggestions for the same source+target pair. This makes re-runs safe.

### Fix 8: Use proven selfChainWithRetry pattern

Replace the current self-chain code with the `selfChainWithRetry` pattern used by `bulk-generate-articles` and `optimize-storage-images` (2 attempts, 3s delay, treats 504 and AbortError as success).

## Technical Details

### Edge Function rewrite: `supabase/functions/scan-for-semantic-links/index.ts`

- Replace `getUser()` with `getClaims()` auth
- Add `selfChainWithRetry()` helper (copy from bulk-generate-articles)
- Add `withTimeout()` helper (copy from optimize-storage-images)
- Wrap batch loop in `try/finally` with self-chain in `finally`
- Replace bidirectional block (lines 300-359) with single reverse `match_semantic_links` RPC call per source article
- Use `anchor_source: 'ai_suggested'` instead of `'semantic'` / `'semantic-reverse'` (valid constraint value)
- Add duplicate check before insert: delete existing pending suggestions for same source+target
- Add individual try/catch per article so one failure does not abort the batch
- Cap each article's processing at 30 seconds via `withTimeout`

### Database migration

1. Update CHECK constraint to also allow `'semantic'` and `'semantic-reverse'` as valid `anchor_source` values (future-proofing)
2. Create `recover_stale_semantic_scan_jobs()` function that:
   - Finds scan jobs with `status = 'processing'` and `updated_at < NOW() - 5 minutes`
   - Re-invokes `scan-for-semantic-links` via `pg_net.http_post` with the stalled `jobId`
   - Marks jobs older than 30 minutes as failed
3. Schedule via pg_cron every 2 minutes

### No UI changes needed

The UI already handles job polling, progress display, and cancellation correctly.

## Reliability layers (after fix)

```text
Layer 1: try/finally           -- self-chain fires even if batch crashes
Layer 2: selfChainWithRetry    -- 2 attempts with 3s delay for network flakes
Layer 3: pg_cron recovery      -- auto-resumes jobs stuck for 5+ minutes
Layer 4: per-article timeout   -- skip slow articles, don't block the batch
Layer 5: constraint handling   -- valid anchor_source values prevent silent failures
```

## Files changed

- `supabase/functions/scan-for-semantic-links/index.ts` -- full rewrite for reliability
- 1 database migration (constraint update + recovery function + cron schedule)

