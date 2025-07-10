-- Create storage bucket for document scanning
INSERT INTO storage.buckets (id, name, public) 
VALUES ('safescan-documents', 'safescan-documents', false);

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

-- Create table for document scan results
CREATE TABLE public.document_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,
  file_path TEXT,
  scan_status TEXT NOT NULL DEFAULT 'pending',
  threat_level TEXT,
  threats_detected INTEGER DEFAULT 0,
  scan_result JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on document_scans table
ALTER TABLE public.document_scans ENABLE ROW LEVEL SECURITY;

-- Create policy for document_scans
CREATE POLICY "Users can manage their own document scans" 
ON public.document_scans 
FOR ALL 
USING (auth.uid() = user_id);