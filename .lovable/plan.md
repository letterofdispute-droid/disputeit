

# Reject All Pending Suggestions + Add Select All Buttons

## Step 1: Reject all 3,415 pending suggestions via database

Run a direct update to reject all current pending suggestions since they were generated with bad anchor text logic:

```sql
UPDATE link_suggestions SET status = 'rejected', hierarchy_violation = 'Pre-anchor-overhaul cleanup' WHERE status = 'pending';
```

## Step 2: Add "Reject All" and "Approve All" buttons to the Links UI

Add two new buttons to the `LinkActions` component that operate on ALL visible/filtered suggestions (not just manually selected ones):

- **Approve All** -- approves every suggestion currently shown in the filtered view
- **Reject All** -- rejects every suggestion currently shown in the filtered view

Both buttons will show a count and use the existing `bulkUpdateStatus` mutation.

## Files Changed

- `src/components/admin/seo/links/LinkActions.tsx` -- add `onApproveAll` and `onRejectAll` props and buttons
- `src/components/admin/seo/LinkSuggestions.tsx` -- add handler functions that collect all filtered suggestion IDs and call `bulkUpdateStatus`
- Database: one-time UPDATE to reject all pending suggestions

## Technical Details

### LinkActions.tsx

Add two new props: `onApproveAll` and `onRejectAll`, plus `filteredCount` to show how many will be affected. Render "Approve All (N)" and "Reject All (N)" buttons when there are filtered suggestions visible.

### LinkSuggestions.tsx

Add two new handlers:

```text
handleApproveAll: collect all filteredSuggestions IDs -> bulkUpdateStatus('approved')
handleRejectAll: collect all filteredSuggestions IDs -> bulkUpdateStatus('rejected')
```

Note: The bulk update mutation already handles arrays of IDs, so no hook changes are needed. The 200-item query limit in the hook is sufficient since the UI already caps at 200 suggestions per view.

