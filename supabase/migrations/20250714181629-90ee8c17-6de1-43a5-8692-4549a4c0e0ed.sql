-- Create tables for SafeNet Connector data
CREATE TABLE IF NOT EXISTS public.network_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_type TEXT NOT NULL,
  network_ranges TEXT[] NOT NULL,
  devices_found INTEGER NOT NULL DEFAULT 0,
  scan_duration INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hostname TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.network_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  scan_id UUID,
  ip_address INET NOT NULL,
  hostname TEXT NOT NULL,
  device_type TEXT NOT NULL,
  mac_address TEXT,
  os_info TEXT,
  open_ports INTEGER[] DEFAULT '{}',
  services JSONB DEFAULT '[]',
  vulnerabilities TEXT[] DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'safe',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  network_range TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ip_address, user_id)
);

-- Enable RLS
ALTER TABLE public.network_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for network_scans
CREATE POLICY "Users can view their own network scans" 
ON public.network_scans FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert network scans" 
ON public.network_scans FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own network scans" 
ON public.network_scans FOR UPDATE 
USING (user_id = auth.uid());

-- Create RLS policies for network_devices
CREATE POLICY "Users can view their own network devices" 
ON public.network_devices FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage network devices" 
ON public.network_devices FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_network_scans_user_id ON public.network_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_network_scans_scanned_at ON public.network_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_network_devices_user_id ON public.network_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_ip ON public.network_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_devices_risk ON public.network_devices(risk_level);
CREATE INDEX IF NOT EXISTS idx_network_devices_last_seen ON public.network_devices(last_seen);