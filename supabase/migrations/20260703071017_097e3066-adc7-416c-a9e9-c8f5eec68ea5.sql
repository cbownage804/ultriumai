CREATE TABLE public.ray_attack_paths (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL,
  investigation_id uuid NULL REFERENCES public.ray_investigations(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Attack Path',
  scenario text NULL,
  status text NOT NULL DEFAULT 'running',
  severity text NULL,
  summary text NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  blast_radius jsonb NOT NULL DEFAULT '{}'::jsonb,
  remediation jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumptions text NULL,
  cost_ray_compute integer NOT NULL DEFAULT 4,
  model text NULL,
  duration_ms integer NULL,
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_attack_paths TO authenticated;
GRANT ALL ON public.ray_attack_paths TO service_role;

ALTER TABLE public.ray_attack_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own attack paths"
  ON public.ray_attack_paths
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_attack_paths_user_idx ON public.ray_attack_paths (user_id, created_at DESC);
CREATE INDEX ray_attack_paths_investigation_idx ON public.ray_attack_paths (investigation_id);