-- Drop existing policies to recreate with proper restrictions
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own letters" ON storage.objects;

-- Recreate policies
CREATE POLICY "Admins can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Anyone can view blog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Users can view own letters"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'letters'
  AND (storage.foldername(name))[1] = auth.uid()::text
);