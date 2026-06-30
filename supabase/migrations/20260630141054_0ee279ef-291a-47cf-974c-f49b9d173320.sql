-- Wrayth 3.0 Ray Action Engine: playbook runs + recommendation linkage

CREATE TABLE public.ray_playbook_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('new','ready','in_progress','paused','completed','archived')),
  estimated_minutes integer NOT NULL DEFAULT 5,
  reward_score integer NOT NULL DEFAULT 0,
  score_delta_actual integer,
  progress integer NOT NULL DEFAULT 0,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  affected_assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_recommendation_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ray_playbook_runs_user_status_idx
  ON public.ray_playbook_runs (user_id, status, started_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_playbook_runs TO authenticated;
GRANT ALL ON public.ray_playbook_runs TO service_role;

ALTER TABLE public.ray_playbook_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own playbook runs"
  ON public.ray_playbook_runs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger (reuse existing function if present, else create)
CREATE OR REPLACE FUNCTION public.ray_playbook_runs_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ray_playbook_runs_touch() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ray_playbook_runs_touch_trg
  BEFORE UPDATE ON public.ray_playbook_runs
  FOR EACH ROW EXECUTE FUNCTION public.ray_playbook_runs_touch();

-- Link a recommendation to its in-flight playbook run (nullable)
ALTER TABLE public.ray_recommendations
  ADD COLUMN IF NOT EXISTS playbook_run_id uuid;
