-- Create SafeShield endpoints table
CREATE TABLE IF NOT EXISTS public.safe_shield_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  ip_address INET NOT NULL,
  os_version TEXT NOT NULL,
  agent_version TEXT NOT NULL DEFAULT '2.1.0',
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'threat_detected', 'isolated')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cpu_usage INTEGER,
  memory_usage INTEGER,
  disk_usage INTEGER,
  threats_count INTEGER DEFAULT 0,
  location TEXT,
  department TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SafeShield threats table
CREATE TABLE IF NOT EXISTS public.safe_shield_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  file_path TEXT,
  process_name TEXT,
  command_line TEXT,
  network_connection TEXT,
  threat_signature TEXT,
  behavioral_indicators TEXT[] DEFAULT '{}',
  ai_confidence_score DECIMAL(3,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'quarantined', 'cleaned', 'false_positive')),
  ai_analysis JSONB NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SafeShield actions table
CREATE TABLE IF NOT EXISTS public.safe_shield_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.safe_shield_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_shield_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_shield_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for endpoints
CREATE POLICY "Users can manage their own endpoints" ON public.safe_shield_endpoints
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for threats  
CREATE POLICY "Users can manage their own threats" ON public.safe_shield_threats
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for actions
CREATE POLICY "Users can manage their own actions" ON public.safe_shield_actions
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_safe_shield_endpoints_user_id ON public.safe_shield_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_safe_shield_endpoints_hostname ON public.safe_shield_endpoints(hostname);
CREATE INDEX IF NOT EXISTS idx_safe_shield_endpoints_status ON public.safe_shield_endpoints(status);

CREATE INDEX IF NOT EXISTS idx_safe_shield_threats_user_id ON public.safe_shield_threats(user_id);
CREATE INDEX IF NOT EXISTS idx_safe_shield_threats_hostname ON public.safe_shield_threats(hostname);
CREATE INDEX IF NOT EXISTS idx_safe_shield_threats_severity ON public.safe_shield_threats(severity);
CREATE INDEX IF NOT EXISTS idx_safe_shield_threats_detected_at ON public.safe_shield_threats(detected_at);

CREATE INDEX IF NOT EXISTS idx_safe_shield_actions_user_id ON public.safe_shield_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_safe_shield_actions_hostname ON public.safe_shield_actions(hostname);
CREATE INDEX IF NOT EXISTS idx_safe_shield_actions_performed_at ON public.safe_shield_actions(performed_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_safe_shield_endpoints_updated_at
  BEFORE UPDATE ON public.safe_shield_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for live updates
ALTER TABLE public.safe_shield_endpoints REPLICA IDENTITY FULL;
ALTER TABLE public.safe_shield_threats REPLICA IDENTITY FULL;
ALTER TABLE public.safe_shield_actions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_shield_endpoints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_shield_threats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_shield_actions;