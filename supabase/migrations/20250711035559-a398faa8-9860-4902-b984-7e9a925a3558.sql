-- SafeTrack IT Asset Management System
-- Create tables for comprehensive IT asset tracking

-- Asset categories and types
CREATE TABLE public.asset_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'laptop',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Main assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  category_id UUID REFERENCES public.asset_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expiry DATE,
  depreciation_rate DECIMAL(5,2) DEFAULT 20.00,
  current_value DECIMAL(10,2),
  location TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'lost', 'disposed')),
  asset_tag TEXT UNIQUE,
  specifications JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Software inventory
CREATE TABLE public.software_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  name TEXT NOT NULL,
  version TEXT,
  vendor TEXT,
  license_key TEXT,
  license_type TEXT DEFAULT 'perpetual' CHECK (license_type IN ('perpetual', 'subscription', 'volume', 'oem', 'trial')),
  seats_total INTEGER DEFAULT 1,
  seats_used INTEGER DEFAULT 0,
  purchase_date DATE,
  expiry_date DATE,
  cost_per_license DECIMAL(10,2),
  support_expiry DATE,
  installation_count INTEGER DEFAULT 0,
  compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'over_licensed', 'under_licensed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset assignments (link assets to users/endpoints)
CREATE TABLE public.asset_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  assigned_to_user TEXT,
  assigned_to_device UUID,
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned', 'lost')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Maintenance records
CREATE TABLE public.asset_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type TEXT DEFAULT 'routine' CHECK (maintenance_type IN ('routine', 'repair', 'upgrade', 'inspection')),
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL(10,2),
  performed_by TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  next_maintenance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset history/audit trail
CREATE TABLE public.asset_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Software installations (track where software is installed)
CREATE TABLE public.software_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  software_asset_id UUID REFERENCES public.software_assets(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  installed_version TEXT,
  installation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE,
  usage_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'uninstalled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default asset categories
INSERT INTO public.asset_categories (name, description, icon) VALUES
('Desktop Computers', 'Desktop workstations and PCs', 'monitor'),
('Laptops', 'Portable computers and notebooks', 'laptop'),
('Servers', 'Server hardware and infrastructure', 'server'),
('Network Equipment', 'Routers, switches, firewalls', 'network'),
('Mobile Devices', 'Smartphones and tablets', 'smartphone'),
('Printers', 'Printers and multifunction devices', 'printer'),
('Storage', 'Hard drives, SSDs, NAS devices', 'hard-drive'),
('Monitors', 'Displays and screens', 'monitor'),
('Peripherals', 'Keyboards, mice, cameras', 'mouse'),
('Software', 'Software licenses and applications', 'code');

-- Enable RLS on all tables
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_installations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can read asset categories" ON public.asset_categories FOR SELECT USING (true);

CREATE POLICY "Users can manage their own assets" ON public.assets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own software assets" ON public.software_assets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own asset assignments" ON public.asset_assignments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own asset maintenance" ON public.asset_maintenance FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view asset history for their assets" ON public.asset_history FOR SELECT USING (asset_id IN (SELECT id FROM public.assets WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their own software installations" ON public.software_installations FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_client_id ON public.assets(client_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_category ON public.assets(category_id);
CREATE INDEX idx_software_assets_user_id ON public.software_assets(user_id);
CREATE INDEX idx_software_assets_client_id ON public.software_assets(client_id);
CREATE INDEX idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX idx_asset_maintenance_asset_id ON public.asset_maintenance(asset_id);
CREATE INDEX idx_asset_history_asset_id ON public.asset_history(asset_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_asset_categories_updated_at
  BEFORE UPDATE ON public.asset_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_software_assets_updated_at
  BEFORE UPDATE ON public.software_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_asset_maintenance_updated_at
  BEFORE UPDATE ON public.asset_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

-- Create trigger for asset history
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.asset_history (asset_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.asset_history (asset_id, action, new_values, changed_by)
    VALUES (NEW.id, 'created', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_history_trigger
  AFTER INSERT OR UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_asset_changes();