ALTER TABLE public.image_optimization_jobs 
ADD COLUMN IF NOT EXISTS file_list jsonb DEFAULT '[]'::jsonb;