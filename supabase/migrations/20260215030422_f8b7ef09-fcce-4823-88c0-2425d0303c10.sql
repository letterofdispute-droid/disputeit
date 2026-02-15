
-- Phase 1: Bulk cleanup of bad link suggestions

-- 1. Auto-reject self-links (source article links to itself)
UPDATE public.link_suggestions ls
SET status = 'rejected'
WHERE ls.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.article_embeddings ae
    WHERE ae.id = ls.target_embedding_id
      AND ae.content_id = ls.source_post_id
  );

-- 2. Auto-reject suggestions with relevance score below 55
UPDATE public.link_suggestions
SET status = 'rejected'
WHERE status = 'pending'
  AND relevance_score < 55;

-- 3. Auto-reject title-prefix anchors (anchor text is start of target title)
UPDATE public.link_suggestions
SET status = 'rejected'
WHERE status = 'pending'
  AND lower(target_title) LIKE lower(anchor_text) || '%'
  AND length(anchor_text) < length(target_title);
