CREATE TABLE public.ray_compliance_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NULL,
  framework TEXT NOT NULL,
  scope TEXT NULL,
  organization_context TEXT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  overall_score INT NULL,
  posture TEXT NULL,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  domains JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  wins JSONB NOT NULL DEFAULT '[]'::jsonb,
  roadmap JSONB NOT NULL DEFAULT '[]'::jsonb,
  executive_summary TEXT NULL,
  compute_credits INT NOT NULL DEFAULT 15,
  duration_ms INT NULL,
  model TEXT NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_compliance_scans TO authenticated;
GRANT ALL ON public.ray_compliance_scans TO service_role;

ALTER TABLE public.ray_compliance_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own compliance scans"
  ON public.ray_compliance_scans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_compliance_scans_user_created_idx
  ON public.ray_compliance_scans(user_id, created_at DESC);

CREATE TRIGGER update_ray_compliance_scans_updated_at
  BEFORE UPDATE ON public.ray_compliance_scans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();