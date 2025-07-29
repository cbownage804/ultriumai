-- Asset Management Tables
CREATE TABLE public.asset_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.asset_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expiry DATE,
  location TEXT,
  assigned_to TEXT,
  assigned_to_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'disposed', 'lost', 'stolen')),
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  asset_tag TEXT UNIQUE,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  qr_code_url TEXT,
  last_audit_date DATE,
  next_audit_date DATE,
  depreciation_method TEXT DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'none')),
  useful_life_years INTEGER,
  current_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'assigned', 'unassigned', 'moved', 'maintenance', 'disposed', 'audited')),
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'upgrade')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost DECIMAL(10,2),
  performed_by TEXT,
  vendor TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_software (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  software_name TEXT NOT NULL,
  version TEXT,
  license_key TEXT,
  license_type TEXT CHECK (license_type IN ('perpetual', 'subscription', 'volume', 'oem', 'trial')),
  install_date DATE,
  expiry_date DATE,
  vendor TEXT,
  cost DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('maintenance', 'support', 'warranty', 'lease', 'insurance')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cost DECIMAL(10,2),
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'one_time')),
  description TEXT,
  terms TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  auto_renewal BOOLEAN DEFAULT false,
  notification_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_contract_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.asset_contracts(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  coverage_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default asset categories
INSERT INTO public.asset_categories (name, description, icon, color) VALUES
('Hardware', 'Physical computing devices and equipment', 'HardDrive', '#3B82F6'),
('Software', 'Software licenses and applications', 'Code', '#10B981'),
('Network', 'Network equipment and infrastructure', 'Wifi', '#8B5CF6'),
('Furniture', 'Office furniture and fixtures', 'Home', '#F59E0B'),
('Vehicles', 'Company vehicles and transport', 'Car', '#EF4444'),
('Mobile Devices', 'Smartphones, tablets, and mobile equipment', 'Smartphone', '#06B6D4'),
('Other', 'Miscellaneous assets', 'Package', '#6B7280');

-- Enable RLS
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_contract_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Asset categories are viewable by everyone" ON public.asset_categories FOR SELECT USING (true);
CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view asset history for their assets" ON public.asset_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_history.asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create asset history for their assets" ON public.asset_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_history.asset_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view maintenance for their assets" ON public.asset_maintenance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_maintenance.asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create maintenance for their assets" ON public.asset_maintenance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_maintenance.asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update maintenance for their assets" ON public.asset_maintenance FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_maintenance.asset_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view software for their assets" ON public.asset_software FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_software.asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create software for their assets" ON public.asset_software FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_software.asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update software for their assets" ON public.asset_software FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_software.asset_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view their own contracts" ON public.asset_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contracts" ON public.asset_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts" ON public.asset_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts" ON public.asset_contracts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view contract items for their contracts" ON public.asset_contract_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.asset_contracts WHERE id = asset_contract_items.contract_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create contract items for their contracts" ON public.asset_contract_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.asset_contracts WHERE id = asset_contract_items.contract_id AND user_id = auth.uid())
);

-- Indexes
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_category_id ON public.assets(category_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_asset_tag ON public.assets(asset_tag);
CREATE INDEX idx_asset_history_asset_id ON public.asset_history(asset_id);
CREATE INDEX idx_asset_maintenance_asset_id ON public.asset_maintenance(asset_id);
CREATE INDEX idx_asset_software_asset_id ON public.asset_software(asset_id);
CREATE INDEX idx_asset_contracts_user_id ON public.asset_contracts(user_id);
CREATE INDEX idx_asset_contract_items_contract_id ON public.asset_contract_items(contract_id);
CREATE INDEX idx_asset_contract_items_asset_id ON public.asset_contract_items(asset_id);

-- Triggers
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_maintenance_updated_at BEFORE UPDATE ON public.asset_maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_software_updated_at BEFORE UPDATE ON public.asset_software FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_contracts_updated_at BEFORE UPDATE ON public.asset_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER log_asset_changes AFTER INSERT OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.log_asset_changes();