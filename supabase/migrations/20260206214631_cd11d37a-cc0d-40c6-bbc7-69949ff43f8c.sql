-- Create bulk_planning_jobs table for tracking async bulk planning operations
CREATE TABLE public.bulk_planning_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id text NOT NULL,
    category_name text NOT NULL,
    value_tier text NOT NULL DEFAULT 'medium',
    total_templates integer NOT NULL DEFAULT 0,
    completed_templates integer NOT NULL DEFAULT 0,
    failed_templates integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'processing',
    template_slugs text[] NOT NULL DEFAULT '{}',
    processed_slugs text[] NOT NULL DEFAULT '{}',
    failed_slugs text[] NOT NULL DEFAULT '{}',
    error_messages jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.bulk_planning_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view bulk planning jobs"
ON public.bulk_planning_jobs
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create bulk planning jobs"
ON public.bulk_planning_jobs
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update bulk planning jobs"
ON public.bulk_planning_jobs
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete bulk planning jobs"
ON public.bulk_planning_jobs
FOR DELETE
USING (is_admin(auth.uid()));

-- Create index for efficient queries
CREATE INDEX idx_bulk_planning_jobs_category_status ON public.bulk_planning_jobs(category_id, status);
CREATE INDEX idx_bulk_planning_jobs_status ON public.bulk_planning_jobs(status);

-- Add updated_at trigger
CREATE TRIGGER update_bulk_planning_jobs_updated_at
BEFORE UPDATE ON public.bulk_planning_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();