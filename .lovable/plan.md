

# Fix Stale Queue & Clarify Step 1 Communication

## The Real Problem

The `embedding_queue` table has **4,015 stale entries** -- articles that were queued by a database trigger but already received embeddings through the bulk job. The queue was never cleaned up, so the UI incorrectly shows "4,015 new articles ready to process" even though all 4,627 articles are already embedded.

This is a data hygiene issue, not just a UI issue.

## Fix (2 parts)

### Part 1: Clean up stale queue entries (database)

Run a one-time SQL migration to mark queue entries as processed when the article already has an embedding. This immediately resolves the "4015 pending" ghost.

### Part 2: Make queue count smarter (code)

Update the pending queue display logic so it cross-references against actual missing embeddings. If `embeddingProgress` is already 100%, the pending queue banner should not appear regardless of stale queue rows. This prevents the problem from recurring.

**Changes in `SemanticScanPanel.tsx`:**
- Only show the "X new articles ready to process" banner when embeddings are actually incomplete (`embeddingProgress < 100`)
- When progress is 100% but queue has stale items, silently ignore them (the success state handles it)
- This is a one-line condition change

## Technical Details

**Migration SQL:**
```sql
UPDATE embedding_queue eq
SET processed_at = NOW()
FROM article_embeddings ae
WHERE eq.content_id = ae.article_id
  AND eq.processed_at IS NULL;
```

**Code change** (`src/components/admin/seo/links/SemanticScanPanel.tsx`):
- Change `hasPendingQueue` usage: only show the pending queue banner when `embeddingProgress < 100 && hasPendingQueue`
- This ensures the "all done" state takes priority over stale queue entries

## Scope
- 1 database migration (cleanup stale queue)
- 1 file modified: `SemanticScanPanel.tsx` (minor condition tweak)

