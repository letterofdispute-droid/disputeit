

# Fix Orphaned "Generating" Items

## Problem

When the edge function crashes mid-article, items get stuck in "generating" status permanently. The job completes, but the item it was processing never gets reset. There's no cleanup mechanism for this.

Currently 1 item is stuck: "Your Entitlement: Receiving Every Single Item You Paid For" (since 07:25 UTC).

## Fix (two parts)

### 1. Immediate cleanup -- reset the stuck item

Reset the orphaned item back to "queued" so it can be re-processed.

### 2. Automatic orphan recovery -- prevent this from happening again

Add a database function and a scheduled job (pg_cron) that periodically checks for items stuck in "generating" status for more than 10 minutes with no active job processing them, and resets them to "queued."

Alternatively (simpler approach): add cleanup logic to the `stopJob` and job completion flow -- when a generation job completes or is cancelled, reset any remaining "generating" items back to "queued."

### 3. UI: Add a "Reset Stuck" action

In the Queue stats bar, when "Generating" count is > 0 but there's no active job running, show a warning indicator and a "Reset Stuck" button that resets all orphaned "generating" items back to "queued."

## Technical Details

**Immediate reset (SQL):**
```sql
UPDATE content_queue 
SET status = 'queued', error_message = NULL 
WHERE status = 'generating' 
  AND id = '74caba1d-de84-4390-b709-022d9cca8b2c';
```

**Automatic orphan recovery (migration):**
```sql
CREATE OR REPLACE FUNCTION reset_orphaned_generating_items()
RETURNS integer AS $$
DECLARE
  reset_count integer;
BEGIN
  UPDATE content_queue
  SET status = 'queued', error_message = NULL
  WHERE status = 'generating'
    AND updated_at < now() - interval '10 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM generation_jobs 
      WHERE status = 'processing'
    );
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**UI change in QueueStats component:**
- Compare `stats.generating > 0` with `isRunning` (from useGenerationJob)
- If generating > 0 but no active job: show warning badge + "Reset Stuck" button
- Button calls the `reset_orphaned_generating_items` RPC

**Files to modify:**
- `src/components/admin/seo/queue/QueueStats.tsx` -- add stuck warning + reset button
- `src/components/admin/seo/ContentQueue.tsx` -- pass `isRunning` to QueueStats, wire up reset RPC
- New migration -- create the cleanup function + reset the current stuck item

