
-- Create fast key-value table for live preview serving
CREATE TABLE public.app_builder_live_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  compiled_html TEXT NOT NULL,
  version_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_slug)
);

-- Enable RLS
ALTER TABLE public.app_builder_live_previews ENABLE ROW LEVEL SECURITY;

-- Users can manage their own previews
CREATE POLICY "Users can manage own live previews"
  ON public.app_builder_live_previews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all for serve-preview function
CREATE POLICY "Service role can read all live previews"
  ON public.app_builder_live_previews FOR SELECT
  USING (public.is_service_role());

-- Index for fast lookup by slug
CREATE INDEX idx_live_previews_slug ON public.app_builder_live_previews (project_slug);
CREATE INDEX idx_live_previews_user_slug ON public.app_builder_live_previews (user_id, project_slug);
