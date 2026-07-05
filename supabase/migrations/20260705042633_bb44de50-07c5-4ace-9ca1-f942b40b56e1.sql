
-- ============ 1. Extend wrayth_remediation_actions with lifecycle ============
ALTER TABLE public.wrayth_remediation_actions
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT NOT NULL DEFAULT 'running'
    CHECK (lifecycle_state IN ('queued','pending_approval','approved','running','verifying','completed','failed','rolled_back','cancelled')),
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS chain_id UUID,
  ADD COLUMN IF NOT EXISTS chain_step_index INTEGER,
  ADD COLUMN IF NOT EXISTS rollback_of UUID REFERENCES public.wrayth_remediation_actions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_label TEXT,
  ADD COLUMN IF NOT EXISTS confidence INTEGER;

CREATE INDEX IF NOT EXISTS wrayth_remediation_actions_lifecycle_idx
  ON public.wrayth_remediation_actions (lifecycle_state, scheduled_for)
  WHERE lifecycle_state IN ('queued','pending_approval','approved');

CREATE INDEX IF NOT EXISTS wrayth_remediation_actions_chain_idx
  ON public.wrayth_remediation_actions (chain_id, chain_step_index)
  WHERE chain_id IS NOT NULL;

-- ============ 2. Remediation policies (per user) ============
CREATE TABLE IF NOT EXISTS public.wrayth_remediation_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_fix_mode TEXT NOT NULL DEFAULT 'suggest_only'
    CHECK (auto_fix_mode IN ('never','suggest_only','auto_low','auto_medium','auto_except_critical','autonomous')),
  always_auto TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  never_auto TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notify_on_complete BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_remediation_policies TO authenticated;
GRANT ALL ON public.wrayth_remediation_policies TO service_role;

ALTER TABLE public.wrayth_remediation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own remediation policy"
  ON public.wrayth_remediation_policies FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own remediation policy"
  ON public.wrayth_remediation_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own remediation policy"
  ON public.wrayth_remediation_policies FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own remediation policy"
  ON public.wrayth_remediation_policies FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.wrayth_remediation_policies_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS wrayth_remediation_policies_touch ON public.wrayth_remediation_policies;
CREATE TRIGGER wrayth_remediation_policies_touch
  BEFORE UPDATE ON public.wrayth_remediation_policies
  FOR EACH ROW EXECUTE FUNCTION public.wrayth_remediation_policies_touch();

-- ============ 3. Maintenance windows ============
CREATE TABLE IF NOT EXISTS public.wrayth_maintenance_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'immediate'
    CHECK (mode IN ('immediate','business_hours','overnight','weekends','custom')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  weekday_mask INTEGER NOT NULL DEFAULT 127, -- bitmask: Sun=1..Sat=64
  start_time TIME,
  end_time TIME,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wrayth_maintenance_windows_user_idx
  ON public.wrayth_maintenance_windows (user_id) WHERE active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_maintenance_windows TO authenticated;
GRANT ALL ON public.wrayth_maintenance_windows TO service_role;

ALTER TABLE public.wrayth_maintenance_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own maintenance windows"
  ON public.wrayth_maintenance_windows FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.wrayth_maintenance_windows_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS wrayth_maintenance_windows_touch ON public.wrayth_maintenance_windows;
CREATE TRIGGER wrayth_maintenance_windows_touch
  BEFORE UPDATE ON public.wrayth_maintenance_windows
  FOR EACH ROW EXECUTE FUNCTION public.wrayth_maintenance_windows_touch();

-- ============ 4. Remediation chains ============
CREATE TABLE IF NOT EXISTS public.wrayth_remediation_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_slug TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wrayth_remediation_chains_user_idx
  ON public.wrayth_remediation_chains (user_id) WHERE active;
CREATE INDEX IF NOT EXISTS wrayth_remediation_chains_trigger_idx
  ON public.wrayth_remediation_chains (trigger_slug) WHERE active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_remediation_chains TO authenticated;
GRANT ALL ON public.wrayth_remediation_chains TO service_role;

ALTER TABLE public.wrayth_remediation_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own remediation chains"
  ON public.wrayth_remediation_chains FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.wrayth_remediation_chains_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS wrayth_remediation_chains_touch ON public.wrayth_remediation_chains;
CREATE TRIGGER wrayth_remediation_chains_touch
  BEFORE UPDATE ON public.wrayth_remediation_chains
  FOR EACH ROW EXECUTE FUNCTION public.wrayth_remediation_chains_touch();
