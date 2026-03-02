
ALTER TABLE public.pages 
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'cms',
  ADD COLUMN IF NOT EXISTS no_index boolean NOT NULL DEFAULT false;
