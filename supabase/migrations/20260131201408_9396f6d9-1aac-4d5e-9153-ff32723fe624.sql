-- Create storage bucket for Vanguard agent downloads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vanguard-agents', 
  'vanguard-agents', 
  true,
  104857600, -- 100MB limit for agent binaries
  ARRAY['application/octet-stream', 'application/x-msdownload', 'application/x-msi', 'application/x-apple-diskimage', 'application/gzip', 'application/x-tar', 'application/x-executable']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- Allow public read access to agent downloads
CREATE POLICY "Public read access for vanguard-agents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vanguard-agents');

-- Allow authenticated users to upload agents (admins only in practice)
CREATE POLICY "Authenticated users can upload agents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vanguard-agents' AND auth.role() = 'authenticated');