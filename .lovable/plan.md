

# Fix: Pillars Hidden at Bottom of Queue Due to Wrong Priority

## The Real Problem

The code logic is actually correct -- pillars show a "Pillar" badge, clusters show the link icon. But you can't see it because:

- All 61 pillars have `priority = 1` (lowest)
- All 751 clusters have `priority = 50` (higher)
- The queue sorts by `priority DESC`, so clusters always appear above pillars
- Pillars get buried at the bottom of the list, invisible

## Fix

### Step 1: Update pillar priorities in the database

Set all pillar articles to `priority = 100` so they sort to the TOP of the queue, above their clusters.

```sql
UPDATE content_queue 
SET priority = 100 
WHERE parent_queue_id IS NULL 
  AND plan_id IN (
    SELECT id FROM content_plans WHERE template_slug LIKE '%-kw-%'
  );
```

This moves all 61 pillars from priority 1 to 100, ensuring they appear at the top of the queue list.

### Step 2: No code changes needed

The QueueTable component already has the correct logic:
- Items with no `parent_queue_id` on keyword plans show a **"Pillar"** badge
- Items with `parent_queue_id` show the cluster link icon with tooltip

Once pillars sort to the top, you will see the "Pillar" badge clearly on the hub articles, followed by their cluster articles with the link icon beneath them.

## Files Changed

- **SQL only**: Update priority from 1 to 100 for 61 pillar rows

