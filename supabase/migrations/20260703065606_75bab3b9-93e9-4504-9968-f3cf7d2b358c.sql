
CREATE TYPE public.ray_investigation_followup_type AS ENUM (
  'executive_report','management_explanation','incident_report','question'
);

CREATE TABLE public.ray_investigation_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES public.ray_investigations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  followup_type public.ray_investigation_followup_type NOT NULL,
  question text NULL,
  title text NOT NULL,
  content text NULL,
  cost_ray_compute integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'complete',
  error text NULL,
  model text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ray_investigation_followups_inv_idx ON public.ray_investigation_followups (investigation_id, created_at DESC);
CREATE INDEX ray_investigation_followups_user_idx ON public.ray_investigation_followups (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_investigation_followups TO authenticated;
GRANT ALL ON public.ray_investigation_followups TO service_role;

ALTER TABLE public.ray_investigation_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own followups"
  ON public.ray_investigation_followups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own followups"
  ON public.ray_investigation_followups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own followups"
  ON public.ray_investigation_followups FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
