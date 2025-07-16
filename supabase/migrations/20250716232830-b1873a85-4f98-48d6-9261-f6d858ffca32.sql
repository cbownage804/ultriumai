-- Enhanced SafeNet Network Topology and Discovery Schema (Corrected)

-- Create enhanced device information table
CREATE TABLE IF NOT EXISTS public.safenet_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL, -- Use connector key instead of FK
  ip_address INET NOT NULL,
  mac_address TEXT,
  hostname TEXT,
  device_type TEXT, -- router, switch, workstation, server, printer, iot, mobile, etc.
  manufacturer TEXT,
  model TEXT,
  os_family TEXT, -- windows, linux, ios, android, etc.
  os_version TEXT,
  os_build TEXT,
  device_role TEXT, -- gateway, dns_server, dhcp_server, domain_controller, etc.
  physical_location TEXT,
  network_segment TEXT,
  vlan_id INTEGER,
  subnet_mask TEXT,
  default_gateway INET,
  dns_servers TEXT[],
  domain_name TEXT,
  is_managed BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  uptime_hours INTEGER,
  cpu_usage NUMERIC(5,2),
  memory_usage NUMERIC(5,2),
  disk_usage NUMERIC(5,2),
  network_utilization NUMERIC(5,2),
  temperature NUMERIC(5,2),
  power_status TEXT,
  snmp_community TEXT,
  snmp_version TEXT,
  discovery_method TEXT[], -- ping, arp, snmp, wmi, ssh, etc.
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  first_discovered TIMESTAMP WITH TIME ZONE DEFAULT now(),
  device_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create network topology relationships table
CREATE TABLE IF NOT EXISTS public.safenet_topology (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL,
  source_device_id UUID REFERENCES public.safenet_devices(id) ON DELETE CASCADE,
  target_device_id UUID REFERENCES public.safenet_devices(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL, -- physical, logical, wireless, vpn, etc.
  interface_source TEXT, -- eth0, wlan0, etc.
  interface_target TEXT,
  port_source INTEGER,
  port_target INTEGER,
  protocol TEXT, -- ethernet, wifi, bluetooth, etc.
  link_speed BIGINT, -- in bps
  link_quality NUMERIC(5,2), -- percentage
  vlan_id INTEGER,
  distance_hops INTEGER,
  latency_ms NUMERIC(8,3),
  bandwidth_utilization NUMERIC(5,2),
  connection_status TEXT DEFAULT 'active', -- active, inactive, degraded
  discovery_protocol TEXT, -- cdp, lldp, snmp, traceroute, etc.
  topology_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(source_device_id, target_device_id, connection_type)
);

-- Create network services table
CREATE TABLE IF NOT EXISTS public.safenet_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.safenet_devices(id) ON DELETE CASCADE,
  port INTEGER NOT NULL,
  protocol TEXT NOT NULL, -- tcp, udp
  service_name TEXT,
  service_version TEXT,
  service_banner TEXT,
  service_state TEXT DEFAULT 'open', -- open, closed, filtered
  service_type TEXT, -- web, database, email, file_sharing, etc.
  security_level TEXT, -- secure, insecure, vulnerable
  certificate_info JSONB,
  response_time_ms NUMERIC(8,3),
  last_response TIMESTAMP WITH TIME ZONE,
  service_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create enhanced vulnerability tracking
CREATE TABLE IF NOT EXISTS public.safenet_vulnerabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.safenet_devices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.safenet_services(id) ON DELETE CASCADE,
  cve_id TEXT,
  vulnerability_type TEXT, -- software, configuration, network, etc.
  severity TEXT NOT NULL, -- critical, high, medium, low, info
  cvss_score NUMERIC(3,1),
  cvss_vector TEXT,
  title TEXT NOT NULL,
  description TEXT,
  solution TEXT,
  vulnerability_references TEXT[],
  exploit_available BOOLEAN DEFAULT false,
  patch_available BOOLEAN DEFAULT false,
  patch_priority TEXT,
  affected_software TEXT,
  affected_versions TEXT[],
  discovery_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'open', -- open, patched, mitigated, accepted, false_positive
  risk_score INTEGER,
  business_impact TEXT,
  vulnerability_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create network segments/subnets table
CREATE TABLE IF NOT EXISTS public.safenet_network_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL,
  network_address CIDR NOT NULL,
  segment_name TEXT,
  segment_type TEXT, -- lan, wan, dmz, guest, iot, management, etc.
  vlan_id INTEGER,
  description TEXT,
  gateway_ip INET,
  dhcp_server_ip INET,
  dns_servers INET[],
  security_zone TEXT, -- trusted, untrusted, dmz, etc.
  isolation_level TEXT, -- full, partial, none
  monitoring_enabled BOOLEAN DEFAULT true,
  device_count INTEGER DEFAULT 0,
  utilization_percentage NUMERIC(5,2),
  segment_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.safenet_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_topology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_network_segments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own devices" ON public.safenet_devices
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own topology" ON public.safenet_topology
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own services" ON public.safenet_services
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own vulnerabilities" ON public.safenet_vulnerabilities
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own network segments" ON public.safenet_network_segments
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_safenet_devices_user_id ON public.safenet_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_devices_connector_key ON public.safenet_devices(connector_key);
CREATE INDEX IF NOT EXISTS idx_safenet_devices_ip ON public.safenet_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_safenet_devices_type ON public.safenet_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_safenet_devices_last_seen ON public.safenet_devices(last_seen);

CREATE INDEX IF NOT EXISTS idx_safenet_topology_user_id ON public.safenet_topology(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_topology_source ON public.safenet_topology(source_device_id);
CREATE INDEX IF NOT EXISTS idx_safenet_topology_target ON public.safenet_topology(target_device_id);

CREATE INDEX IF NOT EXISTS idx_safenet_services_device_id ON public.safenet_services(device_id);
CREATE INDEX IF NOT EXISTS idx_safenet_services_port ON public.safenet_services(port, protocol);

CREATE INDEX IF NOT EXISTS idx_safenet_vulnerabilities_device_id ON public.safenet_vulnerabilities(device_id);
CREATE INDEX IF NOT EXISTS idx_safenet_vulnerabilities_severity ON public.safenet_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_safenet_vulnerabilities_status ON public.safenet_vulnerabilities(status);

CREATE INDEX IF NOT EXISTS idx_safenet_segments_user_id ON public.safenet_network_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_segments_network ON public.safenet_network_segments(network_address);