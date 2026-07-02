
-- 1. Fix: ray_org_memory INSERT policy had NULL WITH CHECK, allowing cross-org inserts.
DROP POLICY IF EXISTS ray_org_memory_admin_insert ON public.ray_org_memory;
CREATE POLICY ray_org_memory_admin_insert
  ON public.ray_org_memory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_team_members otm
      WHERE otm.organization_id = ray_org_memory.org_id
        AND otm.user_id = auth.uid()
        AND otm.role = ANY (ARRAY['owner'::text, 'admin'::text, 'org_admin'::text])
    )
  );

-- 2. Perf: hot path for user-scoped last_seen ordering.
CREATE INDEX IF NOT EXISTS ray_recommendations_user_lastseen_idx
  ON public.ray_recommendations (user_id, status, last_seen_at DESC);

-- 3. Perf: router latency evaluation.
CREATE INDEX IF NOT EXISTS ray_skill_invocations_skill_created_idx
  ON public.ray_skill_invocations (skill_slug, created_at DESC);
