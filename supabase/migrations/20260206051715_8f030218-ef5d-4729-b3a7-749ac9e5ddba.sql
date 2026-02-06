
-- Atlas Contacts table
CREATE TABLE public.atlas_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  location_id UUID,
  department TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  contact_type TEXT DEFAULT 'Employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contacts" ON public.atlas_contacts FOR ALL USING (auth.uid() = user_id);

-- Atlas Flexible Asset Types (user-defined schemas)
CREATE TABLE public.atlas_flexible_asset_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Box',
  color TEXT DEFAULT '#06b6d4',
  fields JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_flexible_asset_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flexible asset types" ON public.atlas_flexible_asset_types FOR ALL USING (auth.uid() = user_id);

-- Atlas Flexible Assets (instances of flexible asset types)
CREATE TABLE public.atlas_flexible_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  asset_type_id UUID REFERENCES public.atlas_flexible_asset_types(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_flexible_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flexible assets" ON public.atlas_flexible_assets FOR ALL USING (auth.uid() = user_id);

-- Atlas Related Items (cross-linking any item to any other)
CREATE TABLE public.atlas_related_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  relationship_type TEXT DEFAULT 'related',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_related_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own related items" ON public.atlas_related_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_atlas_related_source ON public.atlas_related_items(source_type, source_id);
CREATE INDEX idx_atlas_related_target ON public.atlas_related_items(target_type, target_id);

-- Atlas Checklists
CREATE TABLE public.atlas_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  checklist_type TEXT DEFAULT 'General',
  items JSONB NOT NULL DEFAULT '[]',
  is_template BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'not_started',
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own checklists" ON public.atlas_checklists FOR ALL USING (auth.uid() = user_id);

-- Atlas Activity Logs (full audit trail)
CREATE TABLE public.atlas_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  resource_name TEXT,
  action TEXT NOT NULL,
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.atlas_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs" ON public.atlas_activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity logs" ON public.atlas_activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_atlas_activity_resource ON public.atlas_activity_logs(resource_type, resource_id);
CREATE INDEX idx_atlas_activity_org ON public.atlas_activity_logs(organization_id);
CREATE INDEX idx_atlas_activity_created ON public.atlas_activity_logs(created_at DESC);

-- Indexes for performance
CREATE INDEX idx_atlas_contacts_org ON public.atlas_contacts(organization_id);
CREATE INDEX idx_atlas_flexible_assets_org ON public.atlas_flexible_assets(organization_id);
CREATE INDEX idx_atlas_flexible_assets_type ON public.atlas_flexible_assets(asset_type_id);
CREATE INDEX idx_atlas_checklists_org ON public.atlas_checklists(organization_id);

-- Triggers for updated_at
CREATE TRIGGER update_atlas_contacts_updated_at BEFORE UPDATE ON public.atlas_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_atlas_flexible_asset_types_updated_at BEFORE UPDATE ON public.atlas_flexible_asset_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_atlas_flexible_assets_updated_at BEFORE UPDATE ON public.atlas_flexible_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_atlas_checklists_updated_at BEFORE UPDATE ON public.atlas_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
