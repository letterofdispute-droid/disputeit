

# Fix: Embedding Stats Showing 1000/1000

## Problem

The "Articles with embeddings" counter shows **1000/1000** because the stats query fetches all rows from `article_embeddings` and counts them client-side. The database API has a default limit of 1,000 rows per request, so the count is capped at 1,000 regardless of how many embeddings actually exist.

## Solution

Replace the client-side counting approach with **server-side aggregation** using `count: 'exact'` and `head: true` -- the same pattern already used throughout the project for accurate reporting.

## Technical Changes

**File: `src/hooks/useSemanticLinkScan.ts`**

Replace `fetchEmbeddingStats` (currently around lines 197-211) which does:
```
// CURRENT (broken at 1000+)
const { data } = await supabase.from('article_embeddings').select('embedding_status');
return { total: data.length, completed: data.filter(...).length, ... };
```

With three separate `count: 'exact', head: true` queries:
```
// NEW (accurate at any scale)
const { count: total } = await supabase
  .from('article_embeddings')
  .select('*', { count: 'exact', head: true });

const { count: completed } = await supabase
  .from('article_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('embedding_status', 'completed');

const { count: failed } = await supabase
  .from('article_embeddings')
  .select('*', { count: 'exact', head: true })
  .eq('embedding_status', 'failed');

return {
  total: total || 0,
  completed: completed || 0,
  pending: (total || 0) - (completed || 0) - (failed || 0),
  failed: failed || 0,
};
```

This approach:
- Returns accurate counts regardless of table size
- Transfers zero row data (head-only requests)
- Is consistent with the project's existing reporting pattern

## Scope
- 1 file modified (`src/hooks/useSemanticLinkScan.ts`)
- No database or edge function changes needed

