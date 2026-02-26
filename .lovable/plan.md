

# Fix: Orphan Count Stays High After Applying Links

## Root Cause

Two interconnected problems:

1. **`apply-links-bulk` never calls `reconcile_link_counts` after completing.** When 1400 links are applied (HTML content updated with new `<a>` tags), the `inbound_count` and `outbound_count` columns in `article_embeddings` remain stale at their old values. The `get_orphan_articles` RPC checks `inbound_count = 0`, so articles that now DO have inbound links still show as orphans because the counter was never updated.

2. **Smart Scan creates new pending suggestions but shows no scan progress.** The scan job progress polls `semantic_scan_jobs`, but if the edge function times out on the initial call and the self-chain fires, the UI may not pick up the job until the next poll cycle. The pending count rises correctly as new suggestions are found -- this part is working.

## Fix

### 1. Auto-reconcile after apply job completes (`supabase/functions/apply-links-bulk/index.ts`)

When the apply job detects no more approved suggestions and marks the job as `completed` (around line 670-676), add a call to `reconcile_link_counts` RPC. This will:
- Recount actual `<a>` tags in all article HTML
- Update `inbound_count` and `outbound_count` in `article_embeddings`
- Reset ghost suggestions (marked applied but link not found in HTML)

This is the critical missing step -- without it, orphan detection is always stale after bulk link application.

### 2. Auto-invalidate orphan query after apply job completes (frontend)

In `src/components/admin/seo/links/SemanticScanPanel.tsx`, when the apply job transitions from `processing` to `completed`, also invalidate the `orphan-articles` query so the orphan count refreshes automatically.

**Two file changes total.** The reconcile call is the key fix -- it closes the gap between "links applied to HTML" and "counters updated in database."

