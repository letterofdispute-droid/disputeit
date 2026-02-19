

# Fix: Rescue Orphans Cooldown Bypass and Missing Feedback

## Problem

All 198 orphan articles have `next_scan_due_at` set 30 days in the future from the previous rescue run. The `rescue-orphans` function filters for orphans where `next_scan_due_at` is null or in the past, finds 0 scannable orphans, and returns immediately with `"No orphan articles found"`. No job is created, no toast is shown -- the user sees the progress bar briefly, then nothing changes.

The previous rescue only found 16 suggestions for 285 orphans, meaning 269 orphans were scanned but no matches were found. Setting a 30-day cooldown on these makes sense for regular scans, but when the user explicitly clicks "Rescue Orphans", it should override the cooldown.

## Root Causes

1. **`rescue-orphans/index.ts`**: The orphan count query includes the `next_scan_due_at` filter, blocking all 198 cooldown orphans from being re-scanned.
2. **`rescue-orphans/index.ts`**: When the function returns early ("No orphan articles found"), the response is a 200 with `success: true` but the UI mutation's `onSuccess` handler only shows a generic "started" toast and doesn't account for the "nothing to do" case.
3. **`useSemanticLinkScan.ts`**: The `rescueOrphans` mutation doesn't check the response message or differentiate between "job started" and "nothing found".

## Changes

### 1. `supabase/functions/rescue-orphans/index.ts` -- Reset cooldown before counting

When no `jobId` is provided (fresh start), first reset `next_scan_due_at` to null for all orphan articles (inbound_count <= 0). This ensures the user's explicit "Rescue" action always processes all current orphans regardless of cooldown.

```
-- Before counting orphans, reset cooldown for articles that are still orphans
UPDATE article_embeddings
SET next_scan_due_at = NULL
WHERE embedding_status = 'completed'
  AND content_type = 'article'
  AND inbound_count <= 0
  AND embedding IS NOT NULL
  AND next_scan_due_at > NOW();
```

This is safe because:
- Only affects articles with 0 inbound links (still genuinely orphaned)
- Only triggers on a fresh start (no jobId), not during self-chaining batches
- The cooldown will be re-set after each scan attempt

### 2. `src/hooks/useSemanticLinkScan.ts` -- Handle "nothing found" response

Update the `rescueOrphans` mutation's `onSuccess` to check for the `message` field. If it says "No orphan articles found", show a specific toast and don't set `justStartedRescue`.

### 3. `src/components/admin/seo/links/SemanticScanPanel.tsx` -- Pass response handling

Update the rescue button click handler to handle the "nothing to do" case by resetting `justStartedRescue` when the mutation returns without creating a job.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/rescue-orphans/index.ts` | Reset `next_scan_due_at` for still-orphaned articles before counting (lines ~27-44) |
| `src/hooks/useSemanticLinkScan.ts` | Update `rescueOrphans` mutation onSuccess to detect "no orphans" vs "job started" |
| `src/components/admin/seo/links/SemanticScanPanel.tsx` | Use mutation callbacks to reset `justStartedRescue` on "nothing found" |

## Expected Outcome

- Clicking "Rescue Orphans" will always process all current orphans (bypasses cooldown for articles that are still unlinked)
- If genuinely no orphans exist, a clear toast says "No orphan articles to rescue"
- The progress bar and completion feedback work as designed for the full 198 orphan set
