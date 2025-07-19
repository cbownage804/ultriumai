-- Create storage bucket for RMM agent installers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rmm-installers', 
  'rmm-installers', 
  true,
  104857600, -- 100MB limit
  ARRAY['application/octet-stream', 'application/x-msdownload', 'application/x-msdos-program', 'application/vnd.microsoft.portable-executable']
);

-- Create storage policies for the rmm-installers bucket
CREATE POLICY "Public can download RMM installers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'rmm-installers');

CREATE POLICY "Authenticated users can upload RMM installers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'rmm-installers' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage RMM installers" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'rmm-installers');

CREATE POLICY "Authenticated users can update RMM installers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'rmm-installers' AND auth.role() = 'authenticated');