
CREATE TABLE public.ray_code_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NULL,
  mode text NOT NULL CHECK (mode IN ('script','malware')),
  language text NULL,
  input_label text NULL,
  input_payload text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('pending','running','complete','failed')),
  verdict text NULL,
  confidence text NULL,
  confidence_score integer NULL,
  intent text NULL,
  risk_summary text NULL,
  summary text NULL,
  executive_summary text NULL,
  technical_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  behaviors jsonb NOT NULL DEFAULT '[]'::jsonb,
  mitre jsonb NOT NULL DEFAULT '[]'::jsonb,
  iocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_response jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasoning jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_ray_compute integer NOT NULL DEFAULT 0,
  model text NULL,
  duration_ms integer NULL,
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_code_analyses TO authenticated;
GRANT ALL ON public.ray_code_analyses TO service_role;

ALTER TABLE public.ray_code_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own code analyses"
  ON public.ray_code_analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_code_analyses_user_idx
  ON public.ray_code_analyses (user_id, mode, created_at DESC);
