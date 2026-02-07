-- Create evidence photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-photos', 
  'evidence-photos', 
  false, 
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for evidence photos

-- Users can upload their own evidence photos (folder named by user_id)
CREATE POLICY "Users can upload evidence photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own evidence photos
CREATE POLICY "Users can view own evidence photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own evidence photos
CREATE POLICY "Users can delete own evidence photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can access all evidence photos (for PDF generation)
CREATE POLICY "Service role can access all evidence photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'evidence-photos'
  AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'evidence-photos'
  AND auth.role() = 'service_role'
);

-- Create evidence_photos metadata table
CREATE TABLE public.evidence_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES letter_purchases(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  original_filename TEXT,
  file_size_bytes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.evidence_photos ENABLE ROW LEVEL SECURITY;

-- Users can create their own evidence photos
CREATE POLICY "Users can create own evidence photos"
ON public.evidence_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own evidence photos
CREATE POLICY "Users can view own evidence photos"
ON public.evidence_photos FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own evidence photos
CREATE POLICY "Users can update own evidence photos"
ON public.evidence_photos FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own evidence photos
CREATE POLICY "Users can delete own evidence photos"
ON public.evidence_photos FOR DELETE
USING (auth.uid() = user_id);

-- Service role can access all evidence photos
CREATE POLICY "Service role can manage evidence photos"
ON public.evidence_photos FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX idx_evidence_photos_user_id ON public.evidence_photos(user_id);
CREATE INDEX idx_evidence_photos_purchase_id ON public.evidence_photos(purchase_id);