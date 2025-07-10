-- Create storage bucket for document scanning  
INSERT INTO storage.buckets (id, name, public) 
VALUES ('safescan-documents', 'safescan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the document scanning bucket
CREATE POLICY "Users can upload their own documents for scanning" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'safescan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own uploaded documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'safescan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploaded documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'safescan-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);