-- Migration: Create contractor files storage bucket
-- Description: Creates a storage bucket for contractor profile images, ID cards, and portfolio

-- Create the contractor-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-files', 'contractor-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contractor-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'contractor-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access since bucket is public
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'contractor-files');
