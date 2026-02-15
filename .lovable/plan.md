

# Emergency Fix: Runaway Semantic Scan + Duplicate Prevention

## Immediate Damage Control

### Step 1: Cancel the runaway job via database migration
Update the active scan job to 'completed' status immediately to stop all self-chaining and pg_cron recovery attempts.

### Step 2: Delete duplicate link suggestions via database migration
Remove 14,645+ duplicate rows, keeping only the oldest suggestion per (source_post_id, target_slug, status) combination.

## Root Cause Fix

### File: `supabase/functions/scan-for-semantic-links/index.ts`

Three changes to prevent this from ever happening again:

**1. Completion Guard (after checking job cancellation, ~line 456)**

Before fetching the next batch, check if `processed_items >= total_items`. If so, mark the job complete and stop. This prevents the runaway counter from going past the total.

```text
// After fetching jobRow status check:
const { data: progressCheck } = await supabaseAdmin
  .from('semantic_scan_jobs')
  .select('processed_items, total_items')
  .eq('id', currentJobId)
  .single();

if (progressCheck && progressCheck.processed_items >= progressCheck.total_items) {
  // Mark complete and stop
  await supabaseAdmin.from('semantic_scan_jobs').update({
    status: 'completed', completed_at: new Date().toISOString()
  }).eq('id', currentJobId);
  return Response with "Scan complete";
}
```

**2. Atomic Claim: Set `next_scan_due_at` BEFORE processing (move from line 530 to before line 519)**

Currently, `next_scan_due_at` is set AFTER processing each article. This means two concurrent instances can both fetch the same article, both process it, and both create suggestions. Fix: Set `next_scan_due_at` immediately when fetching the batch, BEFORE processing, so concurrent instances get different articles.

```text
// Right after fetching sourceArticles, claim them atomically:
const articleIds = sourceArticles.map(a => a.id);
await supabaseAdmin
  .from('article_embeddings')
  .update({ next_scan_due_at: getNextScanDate() })
  .in('id', articleIds);

// Then process them (remove the per-article next_scan_due_at update from lines 530 and 540)
```

**3. Unique constraint on link_suggestions (database migration)**

Add a unique index on `(source_post_id, target_slug)` WHERE `status = 'pending'` to prevent duplicate suggestions at the database level. The insert will use `ON CONFLICT DO NOTHING` to silently skip duplicates.

Update the insert at line 293:
```text
const { error: insertError } = await supabaseAdmin
  .from('link_suggestions')
  .upsert(newSuggestions, { onConflict: 'source_post_id,target_slug', ignoreDuplicates: true });
```

## UI Fix: Cap Progress Display

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

Line 299 displays raw `processed_items / total_items` which shows "16,770 / 3,662". Cap the displayed processed count to never exceed total:

```text
<span>
  {Math.min(activeScanJob.processed_items, activeScanJob.total_items).toLocaleString()} / {activeScanJob.total_items.toLocaleString()} articles
</span>
```

Also cap `scanJobProgress` percentage to 100% max in the hook.

### File: `src/hooks/useSemanticLinkScan.ts`

Cap the progress calculation so it never exceeds 100:

```text
const scanJobProgress = activeScanJob
  ? Math.min(100, Math.round((activeScanJob.processed_items / Math.max(activeScanJob.total_items, 1)) * 100))
  : 0;
```

## Summary of All Changes

| Change | Type | Purpose |
|--------|------|---------|
| Cancel runaway job | DB migration | Stop the current scan immediately |
| Delete 14,645 duplicate suggestions | DB migration | Clean up duplicate data |
| Add unique partial index on link_suggestions | DB migration | Prevent future duplicates at DB level |
| Completion guard in edge function | Code change | Stop processing when done |
| Atomic claim (set next_scan_due_at before processing) | Code change | Prevent concurrent double-processing |
| Cap progress display in UI | Code change | Never show processed > total |
| Cap progress percentage in hook | Code change | Never show > 100% |

