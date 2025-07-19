-- Create MSP and client management tables for RMM multi-tenancy

-- MSPs table (Managed Service Providers)
CREATE TABLE IF NOT EXISTS public.msps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id)
);

-- MSP Clients table
CREATE TABLE IF NOT EXISTS public.msp_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msp_id uuid NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_code text NOT NULL, -- Unique identifier for the client
  contact_email text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  UNIQUE(msp_id, client_code)
);

-- Enhanced SafeNet connectors table with client isolation
CREATE TABLE IF NOT EXISTS public.safenet_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  msp_id uuid REFERENCES public.msps(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  connector_key text NOT NULL UNIQUE,
  connector_name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired')),
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  configuration jsonb DEFAULT '{}',
  agent_version text,
  metadata jsonb DEFAULT '{}'
);

-- RMM devices with client isolation
CREATE TABLE IF NOT EXISTS public.rmm_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  msp_id uuid REFERENCES public.msps(id),
  client_id uuid REFERENCES public.msp_clients(id),
  connector_id uuid REFERENCES public.safenet_connectors(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  hostname text,
  ip_address inet,
  mac_address text,
  os_name text,
  os_version text,
  device_type text,
  manufacturer text,
  model text,
  serial_number text,
  status text DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'unknown', 'maintenance')),
  last_seen timestamptz,
  is_managed boolean DEFAULT false,
  rustdesk_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  system_info jsonb DEFAULT '{}',
  security_status jsonb DEFAULT '{}',
  CONSTRAINT rmm_devices_client_check CHECK (
    (msp_id IS NULL AND client_id IS NULL) OR 
    (msp_id IS NOT NULL AND client_id IS NOT NULL)
  )
);

-- Update existing rmm_metrics table with client isolation
ALTER TABLE public.rmm_metrics 
ADD COLUMN IF NOT EXISTS msp_id uuid REFERENCES public.msps(id),
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.msp_clients(id);

-- Update existing rmm_command_results table with client isolation  
ALTER TABLE public.rmm_command_results 
ADD COLUMN IF NOT EXISTS msp_id uuid REFERENCES public.msps(id),
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.msp_clients(id);

-- Enable RLS on new tables
ALTER TABLE public.msps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for MSPs
CREATE POLICY "Users can manage their own MSP account" ON public.msps
FOR ALL USING (user_id = auth.uid());

-- RLS policies for MSP clients
CREATE POLICY "MSPs can manage their own clients" ON public.msp_clients
FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- RLS policies for SafeNet connectors
CREATE POLICY "Users can manage their own connectors" ON public.safenet_connectors
FOR ALL USING (
  user_id = auth.uid() OR 
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

-- RLS policies for RMM devices with client isolation
CREATE POLICY "Users can manage their own devices" ON public.rmm_devices
FOR ALL USING (
  user_id = auth.uid() OR 
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

-- Update RLS policies for rmm_metrics with client isolation
DROP POLICY IF EXISTS "Users can manage their own device metrics" ON public.rmm_metrics;
CREATE POLICY "Users can manage their own device metrics" ON public.rmm_metrics
FOR ALL USING (
  user_id = auth.uid() OR 
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

-- Update RLS policies for rmm_command_results with client isolation
DROP POLICY IF EXISTS "Authenticated users can manage command results" ON public.rmm_command_results;
CREATE POLICY "Users can manage their own command results" ON public.rmm_command_results
FOR ALL USING (
  user_id = auth.uid() OR 
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

-- Add updated_at triggers
CREATE TRIGGER update_msps_updated_at BEFORE UPDATE ON public.msps 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_msp_clients_updated_at BEFORE UPDATE ON public.msp_clients 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safenet_connectors_updated_at BEFORE UPDATE ON public.safenet_connectors 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rmm_devices_updated_at BEFORE UPDATE ON public.rmm_devices 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to generate client-specific connector keys
CREATE OR REPLACE FUNCTION public.generate_client_connector_key(client_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'sk-client-' || client_code || '-' || substr(md5(random()::text), 1, 8);
$$;

-- Helper function to validate client access
CREATE OR REPLACE FUNCTION public.validate_client_access(p_connector_key text, p_user_id uuid)
RETURNS TABLE(connector_id uuid, msp_id uuid, client_id uuid, is_valid boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sc.id as connector_id,
    sc.msp_id,
    sc.client_id,
    true as is_valid
  FROM public.safenet_connectors sc
  LEFT JOIN public.msps m ON sc.msp_id = m.id
  WHERE sc.connector_key = p_connector_key
  AND sc.status = 'active'
  AND (sc.user_id = p_user_id OR m.user_id = p_user_id);
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_msps_user_id ON public.msps(user_id);
CREATE INDEX IF NOT EXISTS idx_msp_clients_msp_id ON public.msp_clients(msp_id);
CREATE INDEX IF NOT EXISTS idx_msp_clients_client_code ON public.msp_clients(client_code);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_user_id ON public.safenet_connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_msp_client ON public.safenet_connectors(msp_id, client_id);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_key ON public.safenet_connectors(connector_key);
CREATE INDEX IF NOT EXISTS idx_rmm_devices_client ON public.rmm_devices(msp_id, client_id);
CREATE INDEX IF NOT EXISTS idx_rmm_devices_connector ON public.rmm_devices(connector_id);
CREATE INDEX IF NOT EXISTS idx_rmm_metrics_client ON public.rmm_metrics(msp_id, client_id);
CREATE INDEX IF NOT EXISTS idx_rmm_command_results_client ON public.rmm_command_results(msp_id, client_id);