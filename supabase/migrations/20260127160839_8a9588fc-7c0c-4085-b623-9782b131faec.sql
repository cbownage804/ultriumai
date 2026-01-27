-- Social Media Posts table for AI-powered social media management
CREATE TABLE public.scheduled_social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  post_content TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  bundle_post_id TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_social_posts ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own posts
CREATE POLICY "Users can view own posts" ON public.scheduled_social_posts
FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create own posts" ON public.scheduled_social_posts
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own posts" ON public.scheduled_social_posts
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own posts" ON public.scheduled_social_posts
FOR DELETE USING (auth.uid() = created_by);

-- Admins can manage all posts
CREATE POLICY "Admins can manage all posts" ON public.scheduled_social_posts
FOR ALL USING (public.is_current_user_admin());

-- Storage bucket for AI-generated social media images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social-media-images', 'social-media-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view social images" ON storage.objects
FOR SELECT USING (bucket_id = 'social-media-images');

CREATE POLICY "Authenticated users can upload social images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'social-media-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own social images" ON storage.objects
FOR DELETE USING (bucket_id = 'social-media-images' AND auth.uid() IS NOT NULL);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_scheduled_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_scheduled_posts_timestamp
BEFORE UPDATE ON public.scheduled_social_posts
FOR EACH ROW EXECUTE FUNCTION public.update_scheduled_posts_updated_at();