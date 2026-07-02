
ALTER TABLE public.wrayth_device_actions
  ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  ADD COLUMN IF NOT EXISTS previous_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB,
  ADD COLUMN IF NOT EXISTS rollback_possible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rollback_action TEXT,
  ADD COLUMN IF NOT EXISTS requires_reboot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_by_user BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preflight JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_wrayth_device_actions_device_time
  ON public.wrayth_device_actions(device_id, requested_at DESC);

CREATE TABLE IF NOT EXISTS public.wrayth_agent_release (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  installer_build TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  is_latest BOOLEAN NOT NULL DEFAULT true
);

GRANT SELECT ON public.wrayth_agent_release TO authenticated, anon;
GRANT ALL ON public.wrayth_agent_release TO service_role;
ALTER TABLE public.wrayth_agent_release ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wrayth_agent_release_public_read"
  ON public.wrayth_agent_release FOR SELECT USING (true);

INSERT INTO public.wrayth_agent_release (version, installer_build, notes, is_latest)
VALUES ('0.2.1', 'WraythSetup-0.2.1', 'Hardening + safety pass: risk levels, preflight, rollback records.', true)
ON CONFLICT DO NOTHING;
