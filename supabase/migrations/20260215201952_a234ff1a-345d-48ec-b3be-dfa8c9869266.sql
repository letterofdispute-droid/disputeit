-- Reset "applied" suggestions where the anchor text does NOT exist 
-- as a link in the source article's HTML content.
UPDATE link_suggestions ls
SET status = 'approved', applied_at = NULL
FROM blog_posts bp
WHERE bp.id = ls.source_post_id
  AND ls.status = 'applied'
  AND bp.content NOT LIKE '%>' || ls.anchor_text || '</a>%';