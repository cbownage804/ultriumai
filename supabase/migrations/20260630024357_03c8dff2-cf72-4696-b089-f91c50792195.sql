
-- Reusable updated_at trigger
CREATE OR REPLACE FUNCTION public.ray_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ray_profiles
CREATE TABLE public.ray_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT,
  providers JSONB NOT NULL DEFAULT '{}'::jsonb,
  existing_manager TEXT,
  future_integrations JSONB NOT NULL DEFAULT '[]'::jsonb,
  import_source TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_profiles TO authenticated;
GRANT ALL ON public.ray_profiles TO service_role;
ALTER TABLE public.ray_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ray_profiles_owner_all" ON public.ray_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ray_profiles_updated_at
  BEFORE UPDATE ON public.ray_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();

-- ray_findings
CREATE TABLE public.ray_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ray_findings_user_idx ON public.ray_findings(user_id);
CREATE INDEX ray_findings_user_kind_idx ON public.ray_findings(user_id, kind);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_findings TO authenticated;
GRANT ALL ON public.ray_findings TO service_role;
ALTER TABLE public.ray_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ray_findings_owner_all" ON public.ray_findings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ray_findings_updated_at
  BEFORE UPDATE ON public.ray_findings
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();

-- ray_recommendations
CREATE TABLE public.ray_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open',
  source_finding_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ray_recs_user_idx ON public.ray_recommendations(user_id, status, priority);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_recommendations TO authenticated;
GRANT ALL ON public.ray_recommendations TO service_role;
ALTER TABLE public.ray_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ray_recs_owner_all" ON public.ray_recommendations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ray_recs_updated_at
  BEFORE UPDATE ON public.ray_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();

-- ray_security_scores (append-only history)
CREATE TABLE public.ray_security_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ray_scores_user_created_idx ON public.ray_security_scores(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.ray_security_scores TO authenticated;
GRANT ALL ON public.ray_security_scores TO service_role;
ALTER TABLE public.ray_security_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ray_scores_owner_all" ON public.ray_security_scores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lock down trigger function
REVOKE EXECUTE ON FUNCTION public.ray_set_updated_at() FROM PUBLIC, anon, authenticated;
