-- Create storage bucket for RMM agents if it doesn't already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rmm-agents', 'rmm-agents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for RMM agent uploads
CREATE POLICY "Users can upload RMM agents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'rmm-agents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can download RMM agents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'rmm-agents');

CREATE POLICY "Users can update their RMM agents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'rmm-agents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their RMM agents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'rmm-agents' AND auth.uid()::text = (storage.foldername(name))[1]);