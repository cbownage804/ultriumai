
-- Project settings table for AI App Builder projects
CREATE TABLE public.app_builder_project_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  project_name TEXT,
  visibility TEXT DEFAULT 'private',
  hide_branding BOOLEAN DEFAULT false,
  disable_analytics BOOLEAN DEFAULT false,
  cross_project_sharing BOOLEAN DEFAULT true,
  allow_public_preview BOOLEAN DEFAULT true,
  supabase_url TEXT,
  supabase_anon_key TEXT,
  stripe_publishable_key TEXT,
  github_token TEXT,
  vercel_token TEXT,
  service_keys JSONB DEFAULT '[]'::jsonb,
  env_vars JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_slug)
);

ALTER TABLE public.app_builder_project_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own project settings"
  ON public.app_builder_project_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Domains table for AI App Builder projects
CREATE TABLE public.app_builder_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_slug TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'verifying',
  is_primary BOOLEAN DEFAULT false,
  ssl_status TEXT DEFAULT 'pending',
  txt_record TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

ALTER TABLE public.app_builder_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domains"
  ON public.app_builder_domains FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_app_builder_project_settings_updated_at
  BEFORE UPDATE ON public.app_builder_project_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_builder_domains_updated_at
  BEFORE UPDATE ON public.app_builder_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
