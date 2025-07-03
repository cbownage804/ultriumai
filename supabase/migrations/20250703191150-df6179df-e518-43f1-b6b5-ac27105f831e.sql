-- Add advanced features columns to custom_gpts table
ALTER TABLE public.custom_gpts ADD COLUMN theme_color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.custom_gpts ADD COLUMN logo_url TEXT;
ALTER TABLE public.custom_gpts ADD COLUMN embed_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.custom_gpts ADD COLUMN api_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.custom_gpts ADD COLUMN api_key TEXT;

-- Create storage bucket for GPT documents and logos
INSERT INTO storage.buckets (id, name, public) VALUES ('gpt-documents', 'gpt-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('gpt-logos', 'gpt-logos', true);

-- Create storage policies for gpt-documents bucket
CREATE POLICY "Users can upload their own GPT documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'gpt-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own GPT documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gpt-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own GPT documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'gpt-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for gpt-logos bucket
CREATE POLICY "Users can upload their own GPT logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'gpt-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view GPT logos" ON storage.objects
FOR SELECT USING (bucket_id = 'gpt-logos');

CREATE POLICY "Users can delete their own GPT logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'gpt-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create gpt_documents table
CREATE TABLE public.gpt_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  processed_content TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on gpt_documents
ALTER TABLE public.gpt_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for gpt_documents
CREATE POLICY "Users can view their own GPT documents" ON public.gpt_documents
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own GPT documents" ON public.gpt_documents
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own GPT documents" ON public.gpt_documents
FOR DELETE USING (user_id = auth.uid());