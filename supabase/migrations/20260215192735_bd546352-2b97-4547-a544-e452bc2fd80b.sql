-- Reset "applied" suggestions that are NOT actually in the article HTML
-- This puts them back into the "approved" queue for re-processing
UPDATE link_suggestions 
SET status = 'approved', applied_at = NULL
WHERE status = 'applied'
AND source_post_id IN (
  SELECT DISTINCT ls2.source_post_id 
  FROM link_suggestions ls2
  JOIN blog_posts bp ON bp.id = ls2.source_post_id
  WHERE ls2.status = 'applied'
  AND bp.content NOT LIKE '%<a href=%'
);