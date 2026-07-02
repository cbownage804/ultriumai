
CREATE TABLE IF NOT EXISTS public.ray_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  user_id UUID,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  score_before INTEGER,
  score_after INTEGER,
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations_open INTEGER NOT NULL DEFAULT 0,
  recommendations_resolved INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  delivery_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ray_digests_org_week_idx
  ON public.ray_digests (COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), week_start);

GRANT SELECT ON public.ray_digests TO authenticated;
GRANT ALL ON public.ray_digests TO service_role;

ALTER TABLE public.ray_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own digests"
  ON public.ray_digests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      org_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.org_team_members m
        WHERE m.organization_id = ray_digests.org_id
          AND m.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role manages digests"
  ON public.ray_digests FOR ALL TO service_role
  USING (true) WITH CHECK (true);
