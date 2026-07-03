
CREATE TYPE public.ray_investigation_input_type AS ENUM (
  'url','email','email_headers','ip','domain','file_hash','powershell','event_log','defender_alert','m365_alert'
);

CREATE TYPE public.ray_investigation_status AS ENUM ('pending','running','complete','failed');

CREATE TABLE public.ray_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NULL,
  input_type public.ray_investigation_input_type NOT NULL,
  input_label text NULL,
  input_payload text NOT NULL,
  status public.ray_investigation_status NOT NULL DEFAULT 'pending',
  cost_ray_compute integer NOT NULL DEFAULT 3,
  summary text NULL,
  technical_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text NULL,
  confidence_score integer NULL,
  verdict text NULL,
  mitre jsonb NOT NULL DEFAULT '[]'::jsonb,
  iocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_response jsonb NOT NULL DEFAULT '[]'::jsonb,
  executive_summary text NULL,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text NULL,
  model text NULL,
  duration_ms integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL
);

CREATE INDEX ray_investigations_user_idx ON public.ray_investigations (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_investigations TO authenticated;
GRANT ALL ON public.ray_investigations TO service_role;

ALTER TABLE public.ray_investigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own investigations"
  ON public.ray_investigations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own investigations"
  ON public.ray_investigations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own investigations"
  ON public.ray_investigations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
