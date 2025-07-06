-- SafePass Enterprise - Advanced Password Management
CREATE TABLE IF NOT EXISTS public.safepass_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vault_name TEXT NOT NULL,
  description TEXT,
  encryption_key_hash TEXT NOT NULL,
  access_policies JSONB DEFAULT '{"mfa_required": true, "ip_restrictions": [], "time_restrictions": {}}',
  shared_with JSONB DEFAULT '[]',
  is_shared BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safepass_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'login' CHECK (entry_type IN ('login', 'note', 'card', 'identity')),
  title TEXT NOT NULL,
  encrypted_data JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  password_strength_score INTEGER DEFAULT 0,
  is_compromised BOOLEAN DEFAULT false,
  compromise_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SafeMail Pro - Email Security Platform
CREATE TABLE IF NOT EXISTS public.safemail_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  domain_name TEXT NOT NULL,
  mx_records JSONB DEFAULT '[]',
  spf_record TEXT,
  dmarc_record TEXT,
  dkim_records JSONB DEFAULT '[]',
  security_score INTEGER DEFAULT 0,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  threat_level TEXT DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  is_monitored BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safemail_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES public.safemail_domains(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN ('phishing', 'malware', 'spam', 'spoofing', 'suspicious_attachment', 'blacklisted_sender')),
  sender_email TEXT NOT NULL,
  recipient_email TEXT,
  subject TEXT,
  threat_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  threat_details JSONB NOT NULL,
  action_taken TEXT DEFAULT 'quarantined' CHECK (action_taken IN ('allowed', 'quarantined', 'blocked', 'deleted')),
  false_positive BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SafeNet Advanced - Network Security Monitoring
CREATE TABLE IF NOT EXISTS public.safenet_networks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  network_name TEXT NOT NULL,
  network_range TEXT NOT NULL,
  location TEXT,
  network_type TEXT DEFAULT 'corporate' CHECK (network_type IN ('corporate', 'branch', 'remote', 'cloud')),
  monitoring_enabled BOOLEAN DEFAULT true,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  device_count INTEGER DEFAULT 0,
  vulnerability_count INTEGER DEFAULT 0,
  threat_count INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safenet_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id UUID NOT NULL REFERENCES public.safenet_networks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  ip_address INET NOT NULL,
  mac_address TEXT,
  device_type TEXT NOT NULL,
  os_version TEXT,
  manufacturer TEXT,
  model TEXT,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'unknown')),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  vulnerability_count INTEGER DEFAULT 0,
  is_managed BOOLEAN DEFAULT false,
  security_patches_needed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safenet_vulnerabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.safenet_devices(id) ON DELETE CASCADE,
  network_id UUID REFERENCES public.safenet_networks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vulnerability_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  cvss_score DECIMAL(3,1),
  cve_id TEXT,
  affected_service TEXT,
  port INTEGER,
  solution TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'patched', 'mitigated', 'false_positive')),
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  patched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unified Threat Intelligence
CREATE TABLE IF NOT EXISTS public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threat_type TEXT NOT NULL,
  ioc_type TEXT NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'url', 'hash', 'email')),
  ioc_value TEXT NOT NULL,
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL,
  description TEXT,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence_score INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security Incidents (Central incident management)
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'false_positive')),
  title TEXT NOT NULL,
  description TEXT,
  source_system TEXT NOT NULL,
  source_data JSONB DEFAULT '{}',
  affected_assets JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  response_actions JSONB DEFAULT '[]',
  assigned_to UUID,
  escalation_level INTEGER DEFAULT 0,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  first_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.safepass_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safemail_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safemail_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safenet_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own SafePass vaults" ON public.safepass_vaults
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own SafePass entries" ON public.safepass_entries
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own SafeMail domains" ON public.safemail_domains
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own SafeMail threats" ON public.safemail_threats
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own SafeNet networks" ON public.safenet_networks
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their SafeNet devices" ON public.safenet_devices
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their vulnerabilities" ON public.safenet_vulnerabilities
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Everyone can read threat intelligence" ON public.threat_intelligence
  FOR SELECT USING (true);

CREATE POLICY "System can update threat intelligence" ON public.threat_intelligence
  FOR INSERT USING (true);

CREATE POLICY "Users can manage their security incidents" ON public.security_incidents
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_safepass_vaults_user_id ON public.safepass_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_safepass_entries_vault_id ON public.safepass_entries(vault_id);
CREATE INDEX IF NOT EXISTS idx_safemail_domains_user_id ON public.safemail_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_safemail_threats_domain_id ON public.safemail_threats(domain_id);
CREATE INDEX IF NOT EXISTS idx_safenet_networks_user_id ON public.safenet_networks(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_devices_network_id ON public.safenet_devices(network_id);
CREATE INDEX IF NOT EXISTS idx_safenet_vulnerabilities_device_id ON public.safenet_vulnerabilities(device_id);
CREATE INDEX IF NOT EXISTS idx_threat_intelligence_ioc_value ON public.threat_intelligence(ioc_value);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON public.security_incidents(user_id);

-- Enable realtime
ALTER TABLE public.safepass_vaults REPLICA IDENTITY FULL;
ALTER TABLE public.safemail_threats REPLICA IDENTITY FULL;
ALTER TABLE public.safenet_vulnerabilities REPLICA IDENTITY FULL;
ALTER TABLE public.security_incidents REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.safepass_vaults;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safemail_threats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safenet_vulnerabilities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_incidents;