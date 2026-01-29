-- Add scanner role fields to vanguard_agents table
ALTER TABLE public.vanguard_agents
ADD COLUMN IF NOT EXISTS is_network_scanner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scanner_subnets text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_scan_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS scan_interval_seconds integer DEFAULT 3600;

-- Create index for quick lookup of scanner agents
CREATE INDEX IF NOT EXISTS idx_vanguard_agents_scanner 
ON public.vanguard_agents (user_id, is_network_scanner) 
WHERE is_network_scanner = true;

-- Create table for discovered network devices (from scanner agents)
CREATE TABLE IF NOT EXISTS public.vanguard_discovered_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scanner_agent_id uuid REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
  ip_address inet NOT NULL,
  mac_address text,
  hostname text,
  device_type text DEFAULT 'unknown',
  manufacturer text,
  os_info text,
  open_ports integer[] DEFAULT '{}',
  services jsonb DEFAULT '{}',
  vulnerabilities jsonb DEFAULT '[]',
  risk_level text DEFAULT 'unknown',
  first_seen_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  is_managed boolean DEFAULT false,
  linked_agent_id uuid REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, ip_address)
);

-- Enable RLS on discovered devices
ALTER TABLE public.vanguard_discovered_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for discovered devices
CREATE POLICY "Users can view their own discovered devices"
ON public.vanguard_discovered_devices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discovered devices"
ON public.vanguard_discovered_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discovered devices"
ON public.vanguard_discovered_devices
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discovered devices"
ON public.vanguard_discovered_devices
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_discovered_devices_user 
ON public.vanguard_discovered_devices (user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovered_devices_scanner 
ON public.vanguard_discovered_devices (scanner_agent_id);

CREATE INDEX IF NOT EXISTS idx_discovered_devices_risk 
ON public.vanguard_discovered_devices (user_id, risk_level);