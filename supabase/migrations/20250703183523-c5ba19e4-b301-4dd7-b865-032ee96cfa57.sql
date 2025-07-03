-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- Create policies for file access
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track uploaded files in conversations
CREATE TABLE public.conversation_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.conversation_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conversation files" 
ON public.conversation_files 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversation files" 
ON public.conversation_files 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversation files" 
ON public.conversation_files 
FOR DELETE 
USING (user_id = auth.uid());