-- Create embedding queue table for async processing
CREATE TABLE public.embedding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  trigger_source TEXT NOT NULL,
  priority INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Index for efficient polling of pending items
CREATE INDEX idx_embedding_queue_pending ON public.embedding_queue(priority DESC, created_at ASC) 
WHERE processed_at IS NULL;

-- Unique constraint to prevent duplicate queue entries
CREATE UNIQUE INDEX idx_embedding_queue_unique_pending ON public.embedding_queue(content_type, content_id) 
WHERE processed_at IS NULL;

-- Enable RLS
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage embedding queue"
ON public.embedding_queue FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access embedding queue"
ON public.embedding_queue FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to queue embedding on publish
CREATE OR REPLACE FUNCTION public.queue_embedding_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire when status changes TO 'published'
  IF NEW.status = 'published' AND 
     (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO public.embedding_queue (content_type, content_id, trigger_source, priority)
    VALUES ('blog_post', NEW.id, 'publish', 100)
    ON CONFLICT (content_type, content_id) WHERE processed_at IS NULL DO NOTHING;
  END IF;
  
  -- Fire when published content is updated (content_hash changes)
  IF NEW.status = 'published' AND OLD.status = 'published' AND 
     NEW.content_hash IS DISTINCT FROM OLD.content_hash THEN
    INSERT INTO public.embedding_queue (content_type, content_id, trigger_source, priority)
    VALUES ('blog_post', NEW.id, 'update', 50)
    ON CONFLICT (content_type, content_id) WHERE processed_at IS NULL DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on blog_posts
CREATE TRIGGER trigger_embedding_on_publish
AFTER INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.queue_embedding_on_publish();