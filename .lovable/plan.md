

# Add "Clear All" Button to Link Suggestions

## What You See Now

- 6,250 rejected link suggestions cluttering the review list
- No way to delete/clear them from the UI
- The scan category dropdown already shows all 4 blog categories correctly (consumer-rights, complaint-guides, legal-tips, contractors)

## Changes

### 1. Add a "Clear All" / "Delete" button to `LinkActions.tsx`

Add a destructive "Clear All" button (with a trash icon) that appears when there are any suggestions displayed. This will call a new handler to delete suggestions.

### 2. Wire up delete functionality in `LinkSuggestions.tsx`

Add two delete options:
- **Clear Filtered**: Deletes all suggestions matching the current status/category filters (uses server-side RPC to bypass the 200-row display limit)
- **Clear Selected**: Deletes only checkbox-selected suggestions (already wired via `deleteSuggestions` in the hook)

### 3. Add server-side RPC for bulk delete

Create a database function `bulk_delete_link_suggestions` that accepts a status filter and optional category slug, similar to the existing `bulk_update_link_status` RPC. This ensures all matching rows are deleted, not just the 200 visible in the UI.

## Technical Details

### New migration: `bulk_delete_link_suggestions` RPC

```sql
CREATE OR REPLACE FUNCTION public.bulk_delete_link_suggestions(
  p_status text DEFAULT NULL,
  p_category_slug text DEFAULT NULL
) RETURNS bigint AS $$
DECLARE
  deleted_count bigint;
BEGIN
  IF p_category_slug IS NOT NULL THEN
    DELETE FROM link_suggestions
    WHERE (p_status IS NULL OR status = p_status)
      AND source_post_id IN (
        SELECT id FROM blog_posts WHERE category_slug = p_category_slug
      );
  ELSE
    DELETE FROM link_suggestions
    WHERE (p_status IS NULL OR status = p_status);
  END IF;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### File: `src/hooks/useLinkSuggestions.ts`

Add a new `bulkDeleteByStatus` mutation that calls the RPC.

### File: `src/components/admin/seo/links/LinkActions.tsx`

Add a "Clear All" button with an `AlertDialog` confirmation (to prevent accidental deletion). Shows the current filter context in the confirmation message (e.g., "Delete all 6,250 rejected suggestions?").

### File: `src/components/admin/seo/LinkSuggestions.tsx`

Wire the new `bulkDeleteByStatus` to the LinkActions component, passing the current status and category filters.
