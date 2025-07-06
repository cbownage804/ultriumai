-- Add MSP white labeling and client management tables
CREATE TABLE public.msp_white_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  background_color TEXT DEFAULT '#ffffff',
  custom_domain TEXT,
  support_email TEXT,
  support_phone TEXT,
  terms_of_service_url TEXT,
  privacy_policy_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add MSP clients table for client hierarchy
CREATE TABLE public.msp_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  contact_person TEXT,
  license_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update endpoints to link to MSP clients
ALTER TABLE public.ultrium_shield_endpoints 
ADD COLUMN msp_client_id UUID,
ADD COLUMN license_key TEXT;

-- Update threats to include client info
ALTER TABLE public.ultrium_shield_threats 
ADD COLUMN msp_client_id UUID;

-- Add endpoint agent downloads table
CREATE TABLE public.endpoint_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('windows', 'mac', 'linux')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  download_url TEXT NOT NULL,
  file_size BIGINT,
  checksum TEXT,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.msp_white_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endpoint_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "MSPs can manage their own white label settings" 
ON public.msp_white_labels 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "MSPs can manage their own clients" 
ON public.msp_clients 
FOR ALL 
USING (msp_id = auth.uid());

CREATE POLICY "Users can access endpoint downloads" 
ON public.endpoint_downloads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage endpoint downloads" 
ON public.endpoint_downloads 
FOR ALL 
USING (true);

-- Create indexes
CREATE INDEX idx_msp_white_labels_user_id ON public.msp_white_labels(user_id);
CREATE INDEX idx_msp_clients_msp_id ON public.msp_clients(msp_id);
CREATE INDEX idx_endpoints_client_id ON public.ultrium_shield_endpoints(msp_client_id);
CREATE INDEX idx_threats_client_id ON public.ultrium_shield_threats(msp_client_id);

-- Add triggers for timestamps
CREATE TRIGGER update_msp_white_labels_updated_at
  BEFORE UPDATE ON public.msp_white_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_msp_clients_updated_at
  BEFORE UPDATE ON public.msp_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();