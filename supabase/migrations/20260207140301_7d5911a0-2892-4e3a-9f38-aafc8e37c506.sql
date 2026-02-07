
-- Create table for persistent AI Builder projects
CREATE TABLE public.builder_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  branches JSONB NOT NULL DEFAULT '[{"id":"main","name":"main","isActive":true}]'::jsonb,
  active_branch TEXT NOT NULL DEFAULT 'main',
  settings JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_url TEXT,
  last_saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.builder_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" 
ON public.builder_projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.builder_projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.builder_projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.builder_projects FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for published apps
INSERT INTO storage.buckets (id, name, public) VALUES ('published-apps', 'published-apps', true);

-- Storage policies for published apps
CREATE POLICY "Anyone can view published apps" 
ON storage.objects FOR SELECT USING (bucket_id = 'published-apps');

CREATE POLICY "Users can publish their own apps" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'published-apps' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their published apps" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'published-apps' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their published apps" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'published-apps' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_builder_projects_updated_at
BEFORE UPDATE ON public.builder_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
