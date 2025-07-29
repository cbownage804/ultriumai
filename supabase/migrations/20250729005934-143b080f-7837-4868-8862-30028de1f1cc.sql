-- Create missing Asset Management tables only
CREATE TABLE IF NOT EXISTS public.assets (
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

CREATE TABLE IF NOT EXISTS public.asset_software (
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

CREATE TABLE IF NOT EXISTS public.asset_contracts (
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

CREATE TABLE IF NOT EXISTS public.asset_contract_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.asset_contracts(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  coverage_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing data to asset_categories if needed
INSERT INTO public.asset_categories (name, description, icon) VALUES
('Hardware', 'Physical computing devices and equipment', 'HardDrive'),
('Software', 'Software licenses and applications', 'Code'),
('Network', 'Network equipment and infrastructure', 'Wifi'),
('Furniture', 'Office furniture and fixtures', 'Home'),
('Vehicles', 'Company vehicles and transport', 'Car'),
('Mobile Devices', 'Smartphones, tablets, and mobile equipment', 'Smartphone'),
('Other', 'Miscellaneous assets', 'Package')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_contract_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON public.assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_asset_software_asset_id ON public.asset_software(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_contracts_user_id ON public.asset_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_contract_items_contract_id ON public.asset_contract_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_asset_contract_items_asset_id ON public.asset_contract_items(asset_id);

-- Create triggers
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_software_updated_at BEFORE UPDATE ON public.asset_software FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_contracts_updated_at BEFORE UPDATE ON public.asset_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();