
-- Extend read access for relationships to include user-owned entities (org_id NULL)
DROP POLICY IF EXISTS "ray_relationships read for org members" ON public.ray_relationships;
CREATE POLICY "ray_relationships read for org members"
  ON public.ray_relationships FOR SELECT
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_member(org_id, auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.ray_entities e
      WHERE (e.id = ray_relationships.source_entity_id OR e.id = ray_relationships.target_entity_id)
        AND e.user_id = auth.uid()
    )
  );

-- Same for events
DROP POLICY IF EXISTS "ray_events read for org members" ON public.ray_events;
CREATE POLICY "ray_events read for org members"
  ON public.ray_events FOR SELECT
  TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR (org_id IS NOT NULL AND public.is_org_team_member(org_id, auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.ray_entities e
      WHERE (e.id = ray_events.entity_id OR e.id = ray_events.related_entity_id)
        AND e.user_id = auth.uid()
    )
  );
