-- Update RLS policies for network_scans to allow system inserts
DROP POLICY IF EXISTS "System can insert network scans" ON public.network_scans;
CREATE POLICY "System can insert network scans" 
ON public.network_scans 
FOR INSERT 
WITH CHECK (true);

-- Also check if safenet_devices table exists, if not create it
CREATE TABLE IF NOT EXISTS public.safenet_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  hostname TEXT,
  device_name TEXT,
  manufacturer TEXT,
  model TEXT,
  os_family TEXT,
  os_version TEXT,
  device_type TEXT,
  device_role TEXT,
  mac_address TEXT,
  uptime_hours INTEGER,
  cpu_usage INTEGER,
  memory_usage INTEGER,
  is_managed BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  network_segment TEXT DEFAULT 'unknown',
  vulnerability_count INTEGER DEFAULT 0,
  security_patches_needed INTEGER DEFAULT 0,
  discovery_method TEXT[] DEFAULT ARRAY['network_scan'],
  device_metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, user_id)
);

-- Enable Row Level Security on safenet_devices
ALTER TABLE public.safenet_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for safenet_devices
CREATE POLICY "Users can view their own devices" 
ON public.safenet_devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert devices" 
ON public.safenet_devices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update devices" 
ON public.safenet_devices 
FOR UPDATE 
USING (true);