-- Patch Management table
CREATE TABLE public.patch_management (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  patch_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  kb_article TEXT,
  release_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  installed_at TIMESTAMP WITH TIME ZONE,
  affected_devices INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Backup Jobs table
CREATE TABLE public.backup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  backup_name TEXT NOT NULL,
  backup_type TEXT NOT NULL DEFAULT 'full',
  source_path TEXT,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  size_bytes BIGINT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_scheduled TIMESTAMP WITH TIME ZONE,
  last_success TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Network Devices table
CREATE TABLE public.network_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  ip_address INET,
  mac_address TEXT,
  manufacturer TEXT,
  model TEXT,
  firmware_version TEXT,
  status TEXT NOT NULL DEFAULT 'online',
  parent_device_id UUID REFERENCES public.network_devices(id),
  port_count INTEGER,
  location TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incident Response Playbooks table
CREATE TABLE public.incident_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  steps JSONB NOT NULL DEFAULT '[]',
  auto_trigger BOOLEAN DEFAULT false,
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  times_executed INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dark Web Monitoring table
CREATE TABLE public.dark_web_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  domain TEXT,
  is_active BOOLEAN DEFAULT true,
  last_checked TIMESTAMP WITH TIME ZONE,
  breach_count INTEGER DEFAULT 0,
  latest_breach TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Threat Intelligence Indicators table
CREATE TABLE public.threat_intel_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  indicator_type TEXT NOT NULL,
  indicator_value TEXT NOT NULL,
  threat_type TEXT,
  confidence_score INTEGER DEFAULT 50,
  source TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.patch_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dark_web_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intel_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patch_management
CREATE POLICY "Users can view their own patches" ON public.patch_management FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own patches" ON public.patch_management FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patches" ON public.patch_management FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patches" ON public.patch_management FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for backup_jobs
CREATE POLICY "Users can view their own backups" ON public.backup_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own backups" ON public.backup_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own backups" ON public.backup_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own backups" ON public.backup_jobs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for network_devices
CREATE POLICY "Users can view their own network devices" ON public.network_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own network devices" ON public.network_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own network devices" ON public.network_devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own network devices" ON public.network_devices FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for incident_playbooks
CREATE POLICY "Users can view their own playbooks" ON public.incident_playbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own playbooks" ON public.incident_playbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own playbooks" ON public.incident_playbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own playbooks" ON public.incident_playbooks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dark_web_monitors
CREATE POLICY "Users can view their own monitors" ON public.dark_web_monitors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own monitors" ON public.dark_web_monitors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monitors" ON public.dark_web_monitors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monitors" ON public.dark_web_monitors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for threat_intel_indicators
CREATE POLICY "Users can view their own indicators" ON public.threat_intel_indicators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own indicators" ON public.threat_intel_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own indicators" ON public.threat_intel_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own indicators" ON public.threat_intel_indicators FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_patch_management_user_id ON public.patch_management(user_id);
CREATE INDEX idx_patch_management_status ON public.patch_management(status);
CREATE INDEX idx_backup_jobs_user_id ON public.backup_jobs(user_id);
CREATE INDEX idx_backup_jobs_status ON public.backup_jobs(status);
CREATE INDEX idx_network_devices_user_id ON public.network_devices(user_id);
CREATE INDEX idx_incident_playbooks_user_id ON public.incident_playbooks(user_id);
CREATE INDEX idx_dark_web_monitors_user_id ON public.dark_web_monitors(user_id);
CREATE INDEX idx_threat_intel_indicators_user_id ON public.threat_intel_indicators(user_id);
CREATE INDEX idx_threat_intel_indicators_type ON public.threat_intel_indicators(indicator_type);