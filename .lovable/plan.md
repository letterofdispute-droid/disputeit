
# Clean All Link Suggestions

## What This Does

Delete **all 28,010 link suggestions** from the database (276 pending + 27,724 rejected) so you can start fresh with the AI-powered Smart Scan across all categories.

## Technical Details

### Database Change (Migration)

Run a single SQL statement to truncate the `link_suggestions` table:

```sql
DELETE FROM link_suggestions;
```

This removes all rows regardless of status (pending, rejected, approved, applied). No schema changes needed -- the table structure stays the same.

### No Code Changes

No frontend or edge function changes are required. After clearing, the UI will show 0 across all statuses and you can run Smart Scan category by category.
