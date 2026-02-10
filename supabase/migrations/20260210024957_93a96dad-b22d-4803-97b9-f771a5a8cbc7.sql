
-- Add thumbnail_url column to builder_projects
ALTER TABLE public.builder_projects 
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create storage bucket for project thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-thumbnails', 'project-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own thumbnails
CREATE POLICY "Users can upload own thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own thumbnails
CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to thumbnails
CREATE POLICY "Thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-thumbnails');
