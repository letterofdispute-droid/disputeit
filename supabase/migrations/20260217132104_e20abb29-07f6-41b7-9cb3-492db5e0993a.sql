
-- Add parent_queue_id to link clusters to their pillar in content_queue
ALTER TABLE public.content_queue
ADD COLUMN parent_queue_id uuid REFERENCES public.content_queue(id) ON DELETE SET NULL;

-- Add pillar_link_anchor for suggested anchor text when linking cluster -> pillar
ALTER TABLE public.content_queue
ADD COLUMN pillar_link_anchor text;

-- Index for fast lookups of clusters by pillar
CREATE INDEX idx_content_queue_parent ON public.content_queue(parent_queue_id) WHERE parent_queue_id IS NOT NULL;
