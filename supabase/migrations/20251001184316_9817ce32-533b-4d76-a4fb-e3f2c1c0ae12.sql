-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own test images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own test images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own test images" ON storage.objects;

-- Allow authenticated users to upload test images
CREATE POLICY "Users can upload test images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'test-images');

-- Allow anyone to view test images (bucket is public)
CREATE POLICY "Public can view test images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'test-images');

-- Allow authenticated users to delete their own test images
CREATE POLICY "Users can delete own test images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'test-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);