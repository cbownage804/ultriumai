
INSERT INTO storage.buckets (id, name, public) VALUES ('bug-screenshots', 'bug-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own bug screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Bug screenshots are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'bug-screenshots');
