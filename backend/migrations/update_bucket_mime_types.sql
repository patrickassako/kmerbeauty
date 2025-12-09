-- Add audio/webm and audio/ogg to allowed mime types for chat-attachments bucket
UPDATE storage.buckets
SET allowed_mime_types = array_cat(
  allowed_mime_types, 
  ARRAY['audio/webm', 'audio/ogg']::text[]
)
WHERE name = 'chat-attachments' 
AND NOT (allowed_mime_types @> ARRAY['audio/webm']::text[]); -- avoid duplicates
