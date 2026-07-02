
DO $$ BEGIN
  CREATE TYPE public.wrayth_action_status AS ENUM (
    'pending','approved','dispatched','running','succeeded','failed','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wrayth_action_type AS ENUM (
    'enable_bitlocker',
    'enable_firewall',
    'enable_defender',
    'run_defender_quick_scan',
    'run_defender_full_scan',
    'install_windows_updates',
    'lock_screen',
    'sign_out_user'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.wrayth_device_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.wrayth_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action_type public.wrayth_action_type NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.wrayth_action_status NOT NULL DEFAULT 'pending',
  requested_by uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  dispatched_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wrayth_device_actions_device_status
  ON public.wrayth_device_actions(device_id, status);
CREATE INDEX IF NOT EXISTS idx_wrayth_device_actions_user
  ON public.wrayth_device_actions(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_device_actions TO authenticated;
GRANT ALL ON public.wrayth_device_actions TO service_role;

ALTER TABLE public.wrayth_device_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads actions" ON public.wrayth_device_actions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner inserts actions" ON public.wrayth_device_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner updates actions" ON public.wrayth_device_actions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner deletes actions" ON public.wrayth_device_actions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public._wrayth_actions_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_wrayth_actions_touch ON public.wrayth_device_actions;
CREATE TRIGGER trg_wrayth_actions_touch
  BEFORE UPDATE ON public.wrayth_device_actions
  FOR EACH ROW EXECUTE FUNCTION public._wrayth_actions_touch();

ALTER PUBLICATION supabase_realtime ADD TABLE public.wrayth_device_actions;
