-- Create UltriumShield endpoints table
CREATE TABLE public.ultrium_shield_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  os_version TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'threat_detected', 'isolated')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, hostname)
);

-- Create UltriumShield threats table
CREATE TABLE public.ultrium_shield_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN ('malware', 'ransomware', 'suspicious_process', 'network_anomaly', 'file_modification')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  file_path TEXT,
  process_name TEXT,
  command_line TEXT,
  network_connection TEXT,
  threat_signature TEXT,
  behavioral_indicators TEXT[] DEFAULT '{}',
  ai_confidence_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'quarantined', 'cleaned', 'false_positive')),
  ai_analysis JSONB DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create UltriumShield actions table
CREATE TABLE public.ultrium_shield_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ultrium_shield_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultrium_shield_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultrium_shield_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for endpoints
CREATE POLICY "Users can manage their own endpoints" 
ON public.ultrium_shield_endpoints 
FOR ALL 
USING (user_id = auth.uid());

-- Create RLS policies for threats
CREATE POLICY "Users can manage their own threats" 
ON public.ultrium_shield_threats 
FOR ALL 
USING (user_id = auth.uid());

-- Create RLS policies for actions
CREATE POLICY "Users can manage their own actions" 
ON public.ultrium_shield_actions 
FOR ALL 
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_ultrium_endpoints_user_id ON public.ultrium_shield_endpoints(user_id);
CREATE INDEX idx_ultrium_endpoints_status ON public.ultrium_shield_endpoints(status);
CREATE INDEX idx_ultrium_threats_user_id ON public.ultrium_shield_threats(user_id);
CREATE INDEX idx_ultrium_threats_severity ON public.ultrium_shield_threats(severity);
CREATE INDEX idx_ultrium_threats_detected_at ON public.ultrium_shield_threats(detected_at);
CREATE INDEX idx_ultrium_actions_user_id ON public.ultrium_shield_actions(user_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION public.update_ultrium_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ultrium_endpoints_updated_at
  BEFORE UPDATE ON public.ultrium_shield_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();