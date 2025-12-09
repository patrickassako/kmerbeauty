-- =============================================
-- Create Marketplace Storage Bucket
-- =============================================

-- Create the bucket for marketplace files (images and videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-files',
  'marketplace-files',
  true, -- Public bucket
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage Policies for marketplace-files bucket
-- =============================================

-- Policy 1: Anyone can view/download files (public read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-files');

-- Policy 2: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload marketplace files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace-files' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update own marketplace files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'marketplace-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'marketplace-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete own marketplace files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'marketplace-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- Verification
-- =============================================

-- Verify bucket creation
SELECT * FROM storage.buckets WHERE id = 'marketplace-files';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%marketplace%';
