

# Fix Embedding Stats to Show New Articles + Linking Workflow Guide

## The Problem

You have 5,780 published articles but only 4,627 embeddings. The UI shows "4627 / 4627" (100% complete) because it only counts rows in the embeddings table -- it does not know about the 1,153 new published posts that have no embedding yet. Since it thinks everything is at 100%, the "Process Now" button is hidden.

## The Fix

### 1. Update `fetchEmbeddingStats` in `src/hooks/useSemanticLinkScan.ts`

Change the "total" count from counting `article_embeddings` rows to counting all **published blog posts**. This way:
- Total = 5,780 (all published posts)
- Completed = 4,627 (posts with embeddings)
- Progress = 80% (not 100%)
- The "Process Now" button will appear

The change is small -- replace the `totalRes` query:
```typescript
// Before: counts article_embeddings rows (misses new posts)
supabase.from('article_embeddings').select('*', { count: 'exact', head: true })

// After: counts all published blog posts (the real total)
supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published')
```

### 2. Fix the UI condition in `SemanticScanPanel.tsx`

The "New articles pending" banner (line 314) has an extra guard `embeddingProgress < 100` that blocks it when stats look complete. Remove that condition so the pending queue banner always shows when there are pending items:

```typescript
// Before
{hasPendingQueue && !isJobProcessing && embeddingProgress < 100 && (

// After  
{hasPendingQueue && !isJobProcessing && (
```

Also update the "fully complete" state (line 257) to additionally require no pending queue items -- it already checks `isFullyComplete` which includes `!hasPendingQueue`, so this should work once the stats are correct.

## What To Do After the Fix

Once the fix is deployed, the workflow is:

1. **Step 1 -- Generate Embeddings**: You will now see "1,153 new articles ready to process" with a "Process Now" button. Click it. The system processes in batches of 10; it self-chains so you just wait.

2. **Step 2 -- Discover Links**: Once embeddings are at 5,780/5,780, run a **Smart Scan (AI)** with "All Categories" to find linking opportunities for the new articles. Check "Force re-scan" since the new articles have never been scanned.

3. **Step 3 -- Review and Apply**: Switch to the Link Review tab, review suggestions, approve good ones, then click "Apply to Articles."

Pillar articles already have some links because the generation system adds pillar-to-cluster links during content creation. The scan will find additional cross-cluster and reverse links.

## Files Changed
- `src/hooks/useSemanticLinkScan.ts` -- fix total count to use published blog_posts
- `src/components/admin/seo/links/SemanticScanPanel.tsx` -- remove redundant guard on pending banner
