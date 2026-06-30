
CREATE TABLE IF NOT EXISTS public.ray_playbook_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  playbook_slug text NOT NULL,
  cron text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_playbook_schedules TO authenticated;
GRANT ALL ON public.ray_playbook_schedules TO service_role;

ALTER TABLE public.ray_playbook_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own playbook schedules"
  ON public.ray_playbook_schedules FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ray_playbook_schedules_next_run_idx
  ON public.ray_playbook_schedules (next_run_at)
  WHERE enabled = true;

CREATE TRIGGER ray_playbook_schedules_set_updated_at
  BEFORE UPDATE ON public.ray_playbook_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
