
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Extend existing ray_recommendations to support proactive scanning
ALTER TABLE public.ray_recommendations
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS rule_slug TEXT,
  ADD COLUMN IF NOT EXISTS subject_type TEXT,
  ADD COLUMN IF NOT EXISTS subject_id TEXT,
  ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS suggested_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Relax user_id so org-wide recs (no personal owner) are allowed
ALTER TABLE public.ray_recommendations ALTER COLUMN user_id DROP NOT NULL;

-- Dedupe key for scanner (partial: only enforce when fingerprint is set)
CREATE UNIQUE INDEX IF NOT EXISTS ray_recommendations_fingerprint_uniq
  ON public.ray_recommendations(fingerprint) WHERE fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS ray_recommendations_org_status_idx
  ON public.ray_recommendations(org_id, status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS ray_recommendations_user_status_idx
  ON public.ray_recommendations(user_id, status, last_seen_at DESC);

-- Ensure grants are correct
GRANT SELECT, UPDATE ON public.ray_recommendations TO authenticated;
GRANT ALL ON public.ray_recommendations TO service_role;

-- Add org-admin RLS policies (existing user_id policies remain in effect)
DROP POLICY IF EXISTS "ray_recs_org_admin_read" ON public.ray_recommendations;
CREATE POLICY "ray_recs_org_admin_read"
  ON public.ray_recommendations FOR SELECT
  TO authenticated
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.org_team_members otm
      WHERE otm.organization_id = ray_recommendations.org_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('owner','admin','org_admin')
    )
  );

DROP POLICY IF EXISTS "ray_recs_org_admin_update" ON public.ray_recommendations;
CREATE POLICY "ray_recs_org_admin_update"
  ON public.ray_recommendations FOR UPDATE
  TO authenticated
  USING (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.org_team_members otm
      WHERE otm.organization_id = ray_recommendations.org_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('owner','admin','org_admin')
    )
  )
  WITH CHECK (
    org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.org_team_members otm
      WHERE otm.organization_id = ray_recommendations.org_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('owner','admin','org_admin')
    )
  );

-- ============================================================
-- ray_scan_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ray_scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','error','partial')),
  recs_created INT NOT NULL DEFAULT 0,
  recs_updated INT NOT NULL DEFAULT 0,
  recs_resolved INT NOT NULL DEFAULT 0,
  duration_ms INT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ray_scan_runs_org_idx
  ON public.ray_scan_runs(org_id, created_at DESC);

GRANT SELECT ON public.ray_scan_runs TO authenticated;
GRANT ALL ON public.ray_scan_runs TO service_role;
ALTER TABLE public.ray_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ray_scan_runs_read"
  ON public.ray_scan_runs FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid())
    OR (org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.org_team_members otm
      WHERE otm.organization_id = ray_scan_runs.org_id
        AND otm.user_id = auth.uid()
        AND otm.role IN ('owner','admin','org_admin')
    ))
  );
