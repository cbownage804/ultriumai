-- SafeAV (Antivirus) Tables
CREATE TABLE public.safe_av_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('quick', 'full', 'custom', 'real_time')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  files_scanned BIGINT DEFAULT 0,
  threats_found INTEGER DEFAULT 0,
  threats_quarantined INTEGER DEFAULT 0,
  scan_duration_seconds INTEGER,
  scan_path TEXT,
  scan_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.safe_av_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  definition_version TEXT NOT NULL,
  update_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_signatures BIGINT DEFAULT 0,
  engine_version TEXT NOT NULL DEFAULT '1.0.0',
  update_status TEXT NOT NULL DEFAULT 'current' CHECK (update_status IN ('current', 'outdated', 'updating', 'failed')),
  next_update_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.safe_av_quarantine (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.safe_av_scans(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  threat_name TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  quarantined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'restored', 'deleted')),
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SafeMDR (Managed Detection & Response) Tables
CREATE TABLE public.safe_mdr_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'confirmed', 'resolved', 'false_positive')),
  source_system TEXT DEFAULT 'SafeShield EDR',
  affected_assets TEXT[] DEFAULT '{}',
  assigned_to UUID,
  escalation_level INTEGER DEFAULT 0,
  tactics TEXT[] DEFAULT '{}', -- MITRE ATT&CK tactics
  techniques TEXT[] DEFAULT '{}', -- MITRE ATT&CK techniques
  indicators JSONB DEFAULT '[]', -- IOCs and other indicators
  raw_event_data JSONB DEFAULT '{}',
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.safe_mdr_investigations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.safe_mdr_alerts(id) ON DELETE CASCADE,
  investigation_type TEXT NOT NULL CHECK (investigation_type IN ('Threat Hunting', 'Incident Response', 'Forensic Analysis', 'Malware Analysis')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  investigation_status TEXT NOT NULL DEFAULT 'open' CHECK (investigation_status IN ('open', 'in_progress', 'completed', 'on_hold')),
  investigator_id UUID,
  time_spent_minutes INTEGER DEFAULT 0,
  findings TEXT,
  recommendations TEXT,
  investigation_notes TEXT,
  evidence_collected JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.safe_mdr_incident_response (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.safe_mdr_alerts(id),
  investigation_id UUID REFERENCES public.safe_mdr_investigations(id),
  incident_type TEXT NOT NULL,
  response_actions JSONB DEFAULT '[]',
  containment_status TEXT DEFAULT 'pending' CHECK (containment_status IN ('pending', 'partial', 'complete')),
  eradication_status TEXT DEFAULT 'pending' CHECK (eradication_status IN ('pending', 'in_progress', 'complete')),
  recovery_status TEXT DEFAULT 'pending' CHECK (recovery_status IN ('pending', 'in_progress', 'complete')),
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SafeShield Endpoints table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.safe_shield_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  hostname TEXT NOT NULL,
  ip_address INET,
  mac_address TEXT,
  os_type TEXT NOT NULL CHECK (os_type IN ('windows', 'macos', 'linux')),
  os_version TEXT,
  agent_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  agent_installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  protection_status TEXT NOT NULL DEFAULT 'protected' CHECK (protection_status IN ('protected', 'vulnerable', 'updating', 'error')),
  threat_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safe_av_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_av_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_av_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_incident_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_shield_endpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SafeAV
CREATE POLICY "Users can manage their own AV scans"
ON public.safe_av_scans
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own AV definitions"
ON public.safe_av_definitions
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own quarantine"
ON public.safe_av_quarantine
FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for SafeMDR
CREATE POLICY "Users can manage their own MDR alerts"
ON public.safe_mdr_alerts
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own MDR investigations"
ON public.safe_mdr_investigations
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own incident response"
ON public.safe_mdr_incident_response
FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for SafeShield Endpoints
CREATE POLICY "Users can manage their own endpoints"
ON public.safe_shield_endpoints
FOR ALL
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_safe_av_scans_user_id ON public.safe_av_scans(user_id);
CREATE INDEX idx_safe_av_scans_status ON public.safe_av_scans(status);
CREATE INDEX idx_safe_av_scans_created_at ON public.safe_av_scans(created_at DESC);

CREATE INDEX idx_safe_mdr_alerts_user_id ON public.safe_mdr_alerts(user_id);
CREATE INDEX idx_safe_mdr_alerts_severity ON public.safe_mdr_alerts(severity);
CREATE INDEX idx_safe_mdr_alerts_status ON public.safe_mdr_alerts(status);
CREATE INDEX idx_safe_mdr_alerts_created_at ON public.safe_mdr_alerts(created_at DESC);

CREATE INDEX idx_safe_mdr_investigations_user_id ON public.safe_mdr_investigations(user_id);
CREATE INDEX idx_safe_mdr_investigations_alert_id ON public.safe_mdr_investigations(alert_id);

CREATE INDEX idx_safe_shield_endpoints_user_id ON public.safe_shield_endpoints(user_id);
CREATE INDEX idx_safe_shield_endpoints_status ON public.safe_shield_endpoints(status);

-- Create update triggers
CREATE TRIGGER update_safe_av_scans_updated_at
  BEFORE UPDATE ON public.safe_av_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safe_mdr_alerts_updated_at
  BEFORE UPDATE ON public.safe_mdr_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safe_mdr_investigations_updated_at
  BEFORE UPDATE ON public.safe_mdr_investigations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safe_shield_endpoints_updated_at
  BEFORE UPDATE ON public.safe_shield_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();