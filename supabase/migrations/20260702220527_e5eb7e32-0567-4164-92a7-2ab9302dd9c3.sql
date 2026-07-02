
CREATE TABLE public.ray_org_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  source TEXT NOT NULL DEFAULT 'admin',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_org_memory TO authenticated;
GRANT ALL ON public.ray_org_memory TO service_role;

ALTER TABLE public.ray_org_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ray_org_memory_admin_select" ON public.ray_org_memory FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.org_team_members otm
    WHERE otm.organization_id = ray_org_memory.org_id AND otm.user_id = auth.uid()
      AND otm.role IN ('owner','admin','org_admin')));

CREATE POLICY "ray_org_memory_admin_insert" ON public.ray_org_memory FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_team_members otm
    WHERE otm.organization_id = ray_org_memory.org_id AND otm.user_id = auth.uid()
      AND otm.role IN ('owner','admin','org_admin')));

CREATE POLICY "ray_org_memory_admin_update" ON public.ray_org_memory FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.org_team_members otm
    WHERE otm.organization_id = ray_org_memory.org_id AND otm.user_id = auth.uid()
      AND otm.role IN ('owner','admin','org_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_team_members otm
    WHERE otm.organization_id = ray_org_memory.org_id AND otm.user_id = auth.uid()
      AND otm.role IN ('owner','admin','org_admin')));

CREATE POLICY "ray_org_memory_admin_delete" ON public.ray_org_memory FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.org_team_members otm
    WHERE otm.organization_id = ray_org_memory.org_id AND otm.user_id = auth.uid()
      AND otm.role IN ('owner','admin','org_admin')));

CREATE INDEX idx_ray_org_memory_org ON public.ray_org_memory(org_id);
CREATE INDEX idx_ray_org_memory_category ON public.ray_org_memory(org_id, category);

CREATE TRIGGER update_ray_org_memory_updated_at
  BEFORE UPDATE ON public.ray_org_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
