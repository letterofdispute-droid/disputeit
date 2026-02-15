
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
