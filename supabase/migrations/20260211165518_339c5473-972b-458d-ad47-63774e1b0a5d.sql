-- Add 'pillar' to the article_type check constraint on content_queue
-- First, drop the existing constraint and recreate with pillar added
DO $$
BEGIN
  -- Try to drop the existing check constraint (name may vary)
  BEGIN
    ALTER TABLE public.content_queue DROP CONSTRAINT IF EXISTS content_queue_article_type_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.content_queue DROP CONSTRAINT IF EXISTS check_article_type;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;

-- Recreate with pillar included
ALTER TABLE public.content_queue ADD CONSTRAINT content_queue_article_type_check 
  CHECK (article_type IN ('how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist', 'pillar'));
