
# Fix Stuck Bulk Planning Job

## Summary
The "Damaged Goods" bulk planning job has been stuck for 8+ hours because the edge function's background processing timed out mid-way through. We need to (1) fix the stuck job immediately, and (2) add robustness to prevent this in the future.

## Immediate Fix

### 1. Clean Up Stuck Job
Mark the current stuck job as failed so the UI updates and the admin can retry:

```sql
-- Update the stuck job to 'failed' status
UPDATE bulk_planning_jobs
SET 
  status = 'failed',
  completed_at = NOW(),
  error_messages = error_messages || '{"_timeout": "Job timed out after extended processing"}'::jsonb
WHERE id = '9f21edfa-d6d5-4430-aa1a-8808901c3f57'
  AND status = 'processing';
```

This will:
- Change status from 'processing' to 'failed'
- Allow the "Retry Failed" button to appear for the 3 templates with constraint errors
- Unlock the "Plan 22" button for remaining unprocessed templates

---

## Architectural Improvements

### 2. Add Stale Job Recovery Function
Create a database function similar to `recover_stale_generating_items()` for bulk planning jobs:

```sql
CREATE OR REPLACE FUNCTION recover_stale_planning_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE bulk_planning_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    error_messages = error_messages || '{"_timeout": "Job timed out - no progress for 10+ minutes"}'::jsonb
  WHERE 
    status = 'processing'
    AND updated_at < NOW() - INTERVAL '10 minutes';
END;
$$;
```

### 3. Improve Edge Function Reliability
Update `bulk-plan-category` to:
- Process in smaller batches (max 10 templates per invocation)
- Use a "chunked" approach that chains multiple edge function calls
- Add retry logic with exponential backoff for AI gateway calls

### 4. Fix Article Type Validation
Add pre-validation in the edge function to ensure AI-returned article types match allowed values before inserting:

```typescript
const VALID_ARTICLE_TYPES = ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist'];

// Validate and fix article type before insert
const normalizedType = VALID_ARTICLE_TYPES.find(t => 
  t === article.type || 
  t.replace('-', '') === article.type.replace('-', '').toLowerCase()
) || 'how-to'; // fallback to how-to if invalid
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `recover_stale_planning_jobs()` function |
| `supabase/functions/bulk-plan-category/index.ts` | Add article type validation, batch processing |
| `src/hooks/useBulkPlanningJob.ts` | Add frontend stale job detection (optional) |

---

## Technical Notes

- The current background processing pattern `(async () => {...})()` is unreliable for long-running tasks
- Edge functions should respond quickly and use job queues or smaller batches for processing
- The failed templates (defective-product-complaint, furniture-defect-complaint, food-contamination-complaint) likely received malformed article types from the AI
- After the database fix, the admin can use "Plan 22" to plan the remaining 22 templates
