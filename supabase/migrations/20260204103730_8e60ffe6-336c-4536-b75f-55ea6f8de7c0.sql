-- Content planning and tracking
CREATE TABLE public.content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug TEXT NOT NULL,
  template_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  subcategory_slug TEXT,
  value_tier TEXT NOT NULL DEFAULT 'medium' CHECK (value_tier IN ('high', 'medium', 'longtail')),
  target_article_count INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual article queue
CREATE TABLE public.content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.content_plans(id) ON DELETE CASCADE,
  article_type TEXT NOT NULL CHECK (article_type IN ('how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist')),
  suggested_title TEXT NOT NULL,
  suggested_keywords TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'generating', 'generated', 'published', 'failed')),
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link suggestions (post-generation scanner)
CREATE TABLE public.link_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('template', 'article', 'guide')),
  target_slug TEXT NOT NULL,
  target_title TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  context_snippet TEXT,
  insert_position INTEGER,
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add template linking to existing blog_posts
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS related_templates TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_plan_id UUID REFERENCES public.content_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS article_type TEXT;

-- Enable RLS on new tables
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_plans (admin only)
CREATE POLICY "Admins can view all content plans" ON public.content_plans
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create content plans" ON public.content_plans
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update content plans" ON public.content_plans
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete content plans" ON public.content_plans
  FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS policies for content_queue (admin only)
CREATE POLICY "Admins can view all queue items" ON public.content_queue
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create queue items" ON public.content_queue
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update queue items" ON public.content_queue
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete queue items" ON public.content_queue
  FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS policies for link_suggestions (admin only)
CREATE POLICY "Admins can view all link suggestions" ON public.link_suggestions
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create link suggestions" ON public.link_suggestions
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update link suggestions" ON public.link_suggestions
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete link suggestions" ON public.link_suggestions
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_content_plans_category ON public.content_plans(category_id);
CREATE INDEX idx_content_plans_template ON public.content_plans(template_slug);
CREATE INDEX idx_content_queue_plan ON public.content_queue(plan_id);
CREATE INDEX idx_content_queue_status ON public.content_queue(status);
CREATE INDEX idx_link_suggestions_source ON public.link_suggestions(source_post_id);
CREATE INDEX idx_link_suggestions_status ON public.link_suggestions(status);
CREATE INDEX idx_blog_posts_related_templates ON public.blog_posts USING GIN(related_templates);

-- Trigger for updated_at on content_plans
CREATE TRIGGER update_content_plans_updated_at
  BEFORE UPDATE ON public.content_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();