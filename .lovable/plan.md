

# Fix: Force Re-embed Button + Batch Reject All

## Problem 1: No Force Re-embed Button Visible

The "Force Re-embed" button exists but is hidden inside the "Advanced Settings" collapsible at the bottom of the Semantic Link Intelligence panel. Since all 4,627 articles are already embedded (100%), the primary action area shows only "All articles embedded" with no action buttons. The Force Re-embed button needs to be surfaced prominently in Step 1 when embeddings are complete.

**Fix:** Add a "Force Re-embed All" button directly in the "fully complete" state block (line ~164-172 of SemanticScanPanel.tsx), so it's visible without opening Advanced Settings.

## Problem 2: Reject All Limited to 200 Items

Two issues compound here:
- The query in `useLinkSuggestions.ts` has `.limit(200)`, so only 200 suggestions are ever fetched
- The "Reject All" and "Approve All" buttons operate only on those 200 loaded suggestions
- There are currently 213 pending suggestions, but the same problem would recur with thousands after a new scan

**Fix:** Add a new `bulkRejectAllByStatus` mutation that runs a direct database UPDATE on all matching rows server-side (not limited to the 200 fetched). This bypasses the client-side limit entirely. Similarly for "Approve All".

## Changes

### 1. `src/components/admin/seo/links/SemanticScanPanel.tsx`
- In the "Fully Complete" state block (~line 164), add a "Force Re-embed All" button alongside the success message
- This calls `handleStartBulkEmbedding(true)` which already exists

### 2. `src/hooks/useLinkSuggestions.ts`
- Add a new `bulkUpdateAllByStatus` mutation that updates ALL rows matching a status filter + optional category filter directly in the database, not limited to fetched IDs
- Signature: `({ currentStatus, newStatus, categorySlug? }) => void`
- Uses: `supabase.from('link_suggestions').update({ status: newStatus }).eq('status', currentStatus)` with optional `.eq('blog_posts.category_slug', ...)` via a subquery or RPC

### 3. `src/components/admin/seo/LinkSuggestions.tsx`
- Update `handleApproveAll` and `handleRejectAll` to call the new `bulkUpdateAllByStatus` mutation instead of collecting IDs from `filteredSuggestions`
- This ensures ALL matching rows are updated, not just the 200 loaded

### 4. `src/components/admin/seo/links/LinkActions.tsx`
- Add `isBulkUpdating` prop to show loading state on Approve All / Reject All buttons
- Pass `totalPendingCount` (from a separate count query or stats) to show the real total, not just 200

### 5. Database: Create an RPC for bulk status update
- Create `bulk_update_link_status(p_current_status text, p_new_status text, p_category_slug text DEFAULT NULL)` that updates all matching rows and returns the count
- This avoids the PostgREST 1000-row limit on updates and handles the category join server-side

## Technical Details

### New RPC function:
```sql
CREATE OR REPLACE FUNCTION public.bulk_update_link_status(
  p_current_status text,
  p_new_status text,
  p_category_slug text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  IF p_category_slug IS NOT NULL THEN
    UPDATE link_suggestions ls
    SET status = p_new_status
    FROM blog_posts bp
    WHERE ls.source_post_id = bp.id
      AND bp.category_slug = p_category_slug
      AND ls.status = p_current_status;
  ELSE
    UPDATE link_suggestions
    SET status = p_new_status
    WHERE status = p_current_status;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;
```

### SemanticScanPanel Force Re-embed button placement:
Added directly after the "All articles embedded" success message, making it always visible when Step 1 is complete. Button text: "Force Re-embed All" with a Zap icon.

