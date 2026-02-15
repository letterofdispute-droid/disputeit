

# Fix: Reset Remaining Ghost "Applied" Suggestions

## The Problem

The previous migration only caught articles with **zero** links in the HTML. But 2,431 articles have exactly 1 link while 8 suggestions are marked "applied" — leaving **11,894 ghost suggestions** still incorrectly showing as "applied."

Current state: Applied: 20,749 / Approved: 8,168
Expected after fix: Applied: ~8,855 / Approved: ~20,062

## The Fix

Run a smarter migration that compares the number of "applied" suggestions per article against the actual count of `<a href=` tags in the HTML. Any suggestions exceeding the real link count get reset to "approved."

### Database Migration

```sql
-- For each article, count actual <a href= tags in HTML vs applied suggestions.
-- Reset excess "applied" suggestions back to "approved" for re-processing.
-- Strategy: keep the OLDEST applied suggestions (they're likely the real ones),
-- reset the rest.

WITH article_link_counts AS (
  SELECT 
    bp.id as post_id,
    GREATEST(0, (LENGTH(bp.content) - LENGTH(REPLACE(bp.content, '<a href=', ''))) / 8) as actual_links
  FROM blog_posts bp
),
ranked_suggestions AS (
  SELECT 
    ls.id,
    ls.source_post_id,
    alc.actual_links,
    ROW_NUMBER() OVER (
      PARTITION BY ls.source_post_id 
      ORDER BY ls.applied_at ASC NULLS LAST, ls.created_at ASC
    ) as rn
  FROM link_suggestions ls
  JOIN article_link_counts alc ON alc.post_id = ls.source_post_id
  WHERE ls.status = 'applied'
)
UPDATE link_suggestions 
SET status = 'approved', applied_at = NULL
WHERE id IN (
  SELECT id FROM ranked_suggestions
  WHERE rn > actual_links
);
```

This keeps the N oldest "applied" suggestions (matching the N real links in the HTML) and resets the rest to "approved."

### No code changes needed

The `apply-links-bulk` function already has the race condition fix from the previous edit. This is purely a data correction.

## After Implementation

1. Stats should show ~20,000 approved and ~9,000 applied
2. Run "Apply to Articles" to process the recovered suggestions
3. The error handling added in the previous fix will prevent this from happening again

## Files

- One database migration (SQL only, no code changes)
