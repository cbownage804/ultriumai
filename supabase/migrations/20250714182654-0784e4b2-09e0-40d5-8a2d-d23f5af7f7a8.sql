-- Create storage bucket for SafeNet Connector files
INSERT INTO storage.buckets (id, name, public) VALUES ('safenet-downloads', 'safenet-downloads', true);

-- Create policy for public access to download files
CREATE POLICY "Public access to SafeNet downloads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'safenet-downloads');