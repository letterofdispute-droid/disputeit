-- Create pages table with hierarchy support
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  excerpt text,
  parent_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  meta_title text,
  meta_description text,
  featured_image_url text,
  author_id uuid,
  author text DEFAULT 'Admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Anyone can view published pages"
ON public.pages FOR SELECT
USING (status = 'published');

-- Admins can view all pages
CREATE POLICY "Admins can view all pages"
ON public.pages FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can create pages
CREATE POLICY "Admins can create pages"
ON public.pages FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update pages
CREATE POLICY "Admins can update pages"
ON public.pages FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete pages
CREATE POLICY "Admins can delete pages"
ON public.pages FOR DELETE
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove duplicate RLS policies on blog_posts that don't use is_admin()
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;