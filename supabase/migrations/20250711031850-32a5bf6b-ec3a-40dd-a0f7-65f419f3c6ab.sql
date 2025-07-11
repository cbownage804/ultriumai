-- Create storage bucket for MSP logos
INSERT INTO storage.buckets (id, name, public) VALUES ('msp-logos', 'msp-logos', true);

-- Create storage policies for MSP logos
CREATE POLICY "MSP logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'msp-logos');

CREATE POLICY "MSPs can upload their own logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'msp-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "MSPs can update their own logo" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'msp-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "MSPs can delete their own logo" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'msp-logos' AND auth.uid()::text = (storage.foldername(name))[1]);