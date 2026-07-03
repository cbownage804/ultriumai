-- Map a Microsoft Teams tenant to a Wrayth organization so a Teams tab embed
-- can resolve org context from the tenant it was launched in.

CREATE TABLE public.workplace_teams_org_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.org_teams(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  linked_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

CREATE INDEX workplace_teams_org_links_org_idx
  ON public.workplace_teams_org_links (organization_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workplace_teams_org_links TO authenticated;
GRANT ALL ON public.workplace_teams_org_links TO service_role;

ALTER TABLE public.workplace_teams_org_links ENABLE ROW LEVEL SECURITY;

-- Owners and admins of the org can see + manage the mapping.
CREATE POLICY "Org owners see their Teams tenant links"
ON public.workplace_teams_org_links
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.org_teams t WHERE t.id = organization_id AND t.owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.org_team_members m
    WHERE m.organization_id = workplace_teams_org_links.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org admins insert Teams tenant links"
ON public.workplace_teams_org_links
FOR INSERT TO authenticated
WITH CHECK (
  linked_by = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.org_teams t WHERE t.id = organization_id AND t.owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_team_members m
      WHERE m.organization_id = workplace_teams_org_links.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  )
);

CREATE POLICY "Org admins update Teams tenant links"
ON public.workplace_teams_org_links
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.org_teams t WHERE t.id = organization_id AND t.owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.org_team_members m
    WHERE m.organization_id = workplace_teams_org_links.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org admins delete Teams tenant links"
ON public.workplace_teams_org_links
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.org_teams t WHERE t.id = organization_id AND t.owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.org_team_members m
    WHERE m.organization_id = workplace_teams_org_links.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
);

CREATE OR REPLACE FUNCTION public.workplace_teams_org_links_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER workplace_teams_org_links_touch
BEFORE UPDATE ON public.workplace_teams_org_links
FOR EACH ROW EXECUTE FUNCTION public.workplace_teams_org_links_touch();

-- Resolver used by the Teams tab embed: given a Teams tenant ID, return the
-- linked Wrayth organization if the caller has access to it.
CREATE OR REPLACE FUNCTION public.resolve_teams_tenant_org(_tenant_id TEXT)
RETURNS TABLE (organization_id UUID, organization_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.organization_id, t.name
  FROM public.workplace_teams_org_links l
  JOIN public.org_teams t ON t.id = l.organization_id
  WHERE l.tenant_id = _tenant_id
    AND (
      t.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.org_team_members m
        WHERE m.organization_id = l.organization_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
      )
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_teams_tenant_org(TEXT) TO authenticated;