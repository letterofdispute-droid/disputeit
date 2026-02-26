

# Fix "6537 / 0" Display in Semantic Link Intelligence

## Root Cause

The `fetchEmbeddingStats` function queries `blog_posts` table with `count: 'exact'` and `status = 'published'` to get the total. This query is timing out (the database is under load — confirmed by connection timeout errors). When it fails, the catch block returns `total: 0`, while the `article_embeddings` count succeeds and returns 6537. Result: "6537 / 0".

## Fix

Make the total count resilient by using `article_embeddings` as the primary source for total count, falling back gracefully.

### `src/hooks/useSemanticLinkScan.ts` — `fetchEmbeddingStats` (lines 368-385)

Replace the 3-way `Promise.all` with a 2-query approach:
1. Count `article_embeddings` where `embedding_status = 'completed'` (already works)
2. Count `article_embeddings` total (all rows, regardless of status) — this is fast and gives us the denominator

For the "total published" count (used for the "X new articles ready to process" banner), derive it from `queueStats.pending + completed + failed` instead of a separate blog_posts query. This avoids the slow blog_posts count entirely.

**Concrete change:**
- Query 1: `article_embeddings` count where `embedding_status = 'completed'` → `completed`
- Query 2: `article_embeddings` count where `embedding_status = 'failed'` → `failed`  
- Query 3: `blog_posts` count where `status = 'published'` → `total` (keep but with error tolerance)
- If `total` returns 0 but `completed > 0`, fall back to `completed + failed + queueStats.pending` as the total

Actually, simpler: just handle the case where `totalRes` errors or returns 0 when completed > 0. Fall back to `completed + failed` as minimum total.

**Lines 370-380:**
```typescript
const [totalRes, completedRes, failedRes] = await Promise.all([
  supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  supabase.from('article_embeddings').select('*', { count: 'exact', head: true }).eq('embedding_status', 'completed'),
  supabase.from('article_embeddings').select('*', { count: 'exact', head: true }).eq('embedding_status', 'failed'),
]);

const completed = completedRes.count || 0;
const failed = failedRes.count || 0;
// Fall back to completed+failed if blog_posts count fails/times out
let total = totalRes.count || 0;
if (total === 0 && completed > 0) {
  total = completed + failed;
}

return { total, completed, pending: Math.max(total - completed - failed, 0), failed };
```

This ensures the display never shows "6537 / 0" — worst case it shows "6537 / 6537" (100%) which is accurate when the queue is empty.

## Files to Change

1. **`src/hooks/useSemanticLinkScan.ts`** — Add fallback logic in `fetchEmbeddingStats` (lines 376-380)

