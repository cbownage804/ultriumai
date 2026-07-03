
-- ============================================================
-- v0.5 Phase A: Security Graph foundation
-- Three tables: ray_entities (nodes), ray_relationships (edges), ray_events (timeline)
-- ============================================================

-- ---------- ray_entities ----------
CREATE TABLE public.ray_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  user_id UUID,
  type TEXT NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ray_entities_org_type_external_uidx
  ON public.ray_entities (org_id, type, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX ray_entities_org_type_idx ON public.ray_entities (org_id, type);
CREATE INDEX ray_entities_user_idx ON public.ray_entities (user_id) WHERE user_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_entities TO authenticated;
GRANT ALL ON public.ray_entities TO service_role;

ALTER TABLE public.ray_entities ENABLE ROW LEVEL SECURITY;

-- Read: org members, ultrium employees, or the owning user
CREATE POLICY "ray_entities read for org members"
  ON public.ray_entities FOR SELECT
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_member(org_id, auth.uid()))
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

-- Write: org admins or ultrium employees (mostly done via service role from edge functions)
CREATE POLICY "ray_entities write for org admins"
  ON public.ray_entities FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_admin(org_id, auth.uid()))
  );

CREATE POLICY "ray_entities update for org admins"
  ON public.ray_entities FOR UPDATE
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_admin(org_id, auth.uid()))
  )
  WITH CHECK (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_admin(org_id, auth.uid()))
  );

CREATE POLICY "ray_entities delete for org admins"
  ON public.ray_entities FOR DELETE
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_admin(org_id, auth.uid()))
  );

-- ---------- ray_relationships ----------
CREATE TABLE public.ray_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  source_entity_id UUID NOT NULL REFERENCES public.ray_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES public.ray_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ray_relationships_edge_uidx
  ON public.ray_relationships (source_entity_id, target_entity_id, relationship_type);
CREATE INDEX ray_relationships_source_idx ON public.ray_relationships (source_entity_id);
CREATE INDEX ray_relationships_target_idx ON public.ray_relationships (target_entity_id);
CREATE INDEX ray_relationships_org_idx ON public.ray_relationships (org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_relationships TO authenticated;
GRANT ALL ON public.ray_relationships TO service_role;

ALTER TABLE public.ray_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ray_relationships read for org members"
  ON public.ray_relationships FOR SELECT
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_member(org_id, auth.uid()))
  );

CREATE POLICY "ray_relationships write for org admins"
  ON public.ray_relationships FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_admin(org_id, auth.uid()))
  );

CREATE POLICY "ray_relationships delete for org admins"
  ON public.ray_relationships FOR DELETE
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_admin(org_id, auth.uid()))
  );

-- ---------- ray_events ----------
CREATE TABLE public.ray_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  entity_id UUID NOT NULL REFERENCES public.ray_entities(id) ON DELETE CASCADE,
  related_entity_id UUID REFERENCES public.ray_entities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'unknown',
  dedup_key TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ray_events_dedup_uidx
  ON public.ray_events (dedup_key)
  WHERE dedup_key IS NOT NULL;

CREATE INDEX ray_events_entity_time_idx
  ON public.ray_events (entity_id, occurred_at DESC);
CREATE INDEX ray_events_related_time_idx
  ON public.ray_events (related_entity_id, occurred_at DESC)
  WHERE related_entity_id IS NOT NULL;
CREATE INDEX ray_events_org_time_idx
  ON public.ray_events (org_id, occurred_at DESC);
CREATE INDEX ray_events_type_time_idx
  ON public.ray_events (event_type, occurred_at DESC);

GRANT SELECT ON public.ray_events TO authenticated;
GRANT ALL ON public.ray_events TO service_role;

ALTER TABLE public.ray_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ray_events read for org members"
  ON public.ray_events FOR SELECT
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_member(org_id, auth.uid()))
  );

-- Events are append-only from edge functions via service role.
-- No INSERT/UPDATE/DELETE policies for authenticated by design.

-- ---------- updated_at trigger for ray_entities ----------
CREATE TRIGGER ray_entities_set_updated_at
  BEFORE UPDATE ON public.ray_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
