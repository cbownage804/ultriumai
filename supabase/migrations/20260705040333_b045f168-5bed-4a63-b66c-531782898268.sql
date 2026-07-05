
-- Unified remediation audit table (provider-agnostic).
-- Agent actions still queue via wrayth_device_actions; this table is the
-- long-term audit trail that also holds cloud-only (M365) remediations.

CREATE TABLE IF NOT EXISTS public.wrayth_remediation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('agent','ms365','defender')),
  slug TEXT NOT NULL,
  action_type TEXT NOT NULL,
  category TEXT,
  risk TEXT NOT NULL CHECK (risk IN ('low','medium','high')),
  target_type TEXT NOT NULL CHECK (target_type IN ('device','user','tenant','message')),
  target_id TEXT NOT NULL,
  target_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','succeeded','failed','cancelled')),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_state JSONB,
  new_state JSONB,
  result JSONB,
  error TEXT,
  duration_ms INTEGER,
  permission_scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  requires_reboot BOOLEAN NOT NULL DEFAULT false,
  reversible BOOLEAN NOT NULL DEFAULT false,
  reverse_slug TEXT,
  confirmed_by_user BOOLEAN NOT NULL DEFAULT false,
  -- Correlation: agent-side actions link back to the wrayth_device_actions row.
  agent_action_id UUID REFERENCES public.wrayth_device_actions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wrayth_remediation_actions_user_created_idx
  ON public.wrayth_remediation_actions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wrayth_remediation_actions_target_idx
  ON public.wrayth_remediation_actions (target_type, target_id);
CREATE INDEX IF NOT EXISTS wrayth_remediation_actions_agent_link_idx
  ON public.wrayth_remediation_actions (agent_action_id) WHERE agent_action_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.wrayth_remediation_actions TO authenticated;
GRANT ALL ON public.wrayth_remediation_actions TO service_role;

ALTER TABLE public.wrayth_remediation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own remediation history"
  ON public.wrayth_remediation_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert remediations for themselves"
  ON public.wrayth_remediation_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.wrayth_remediation_actions_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS wrayth_remediation_actions_touch ON public.wrayth_remediation_actions;
CREATE TRIGGER wrayth_remediation_actions_touch
  BEFORE UPDATE ON public.wrayth_remediation_actions
  FOR EACH ROW EXECUTE FUNCTION public.wrayth_remediation_actions_touch();

-- Realtime for the Runner to subscribe to a single action row.
ALTER TABLE public.wrayth_remediation_actions REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='wrayth_remediation_actions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wrayth_remediation_actions;
  END IF;
END $$;
