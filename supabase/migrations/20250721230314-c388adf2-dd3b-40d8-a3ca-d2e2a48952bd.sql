-- Create SafeNet tables for network scanning and device management

-- Create network_scans table
CREATE TABLE IF NOT EXISTS public.network_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID,
  scan_type TEXT NOT NULL DEFAULT 'network_discovery',
  network_ranges TEXT[] NOT NULL DEFAULT '{}',
  devices_found INTEGER NOT NULL DEFAULT 0,
  scan_duration INTEGER,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hostname TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create network_devices table
CREATE TABLE IF NOT EXISTS public.network_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  scan_id UUID,
  ip_address TEXT NOT NULL,
  hostname TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  mac_address TEXT,
  os_info TEXT,
  open_ports INTEGER[],
  services JSONB,
  vulnerabilities TEXT[],
  risk_level TEXT NOT NULL DEFAULT 'low',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'offline',
  network_range TEXT NOT NULL,
  connector_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create safenet_connectors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.safenet_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL UNIQUE,
  connector_name TEXT NOT NULL,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  version TEXT,
  system_info JSONB,
  network_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.network_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_connectors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for network_scans
CREATE POLICY "Users can view their own network scans" 
ON public.network_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own network scans" 
ON public.network_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network scans" 
ON public.network_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network scans" 
ON public.network_scans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for network_devices
CREATE POLICY "Users can view their own network devices" 
ON public.network_devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own network devices" 
ON public.network_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network devices" 
ON public.network_devices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network devices" 
ON public.network_devices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for safenet_connectors
CREATE POLICY "Users can view their own safenet connectors" 
ON public.safenet_connectors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own safenet connectors" 
ON public.safenet_connectors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own safenet connectors" 
ON public.safenet_connectors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own safenet connectors" 
ON public.safenet_connectors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_network_scans_user_id ON public.network_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_network_scans_scanned_at ON public.network_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_network_devices_user_id ON public.network_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_ip_address ON public.network_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_devices_last_seen ON public.network_devices(last_seen);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_user_id ON public.safenet_connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_status ON public.safenet_connectors(status);