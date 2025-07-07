-- Drop and recreate threat intelligence table with proper structure
DROP TABLE IF EXISTS public.threat_intelligence;

-- Create threat intelligence table for storing threat analysis results
CREATE TABLE public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  indicator_value TEXT NOT NULL,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'url', 'hash', 'email')),
  reputation TEXT NOT NULL CHECK (reputation IN ('clean', 'questionable', 'suspicious', 'malicious')),
  score INTEGER NOT NULL DEFAULT 0,
  threats JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  last_analyzed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI EDR behavioral analysis table
CREATE TABLE public.edr_behavioral_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_id UUID REFERENCES public.safe_shield_endpoints(id),
  process_id INTEGER NOT NULL,
  process_name TEXT NOT NULL,
  parent_process_id INTEGER,
  parent_process_name TEXT,
  command_line TEXT,
  file_path TEXT,
  hash_sha256 TEXT,
  network_connections JSONB DEFAULT '[]',
  file_operations JSONB DEFAULT '[]',
  registry_operations JSONB DEFAULT '[]',
  memory_analysis JSONB DEFAULT '{}',
  behavior_score INTEGER DEFAULT 0 CHECK (behavior_score >= 0 AND behavior_score <= 100),
  anomaly_indicators JSONB DEFAULT '[]',
  ai_confidence_score DECIMAL(5,2) DEFAULT 0.0 CHECK (ai_confidence_score >= 0.0 AND ai_confidence_score <= 100.0),
  threat_classification TEXT CHECK (threat_classification IN ('benign', 'suspicious', 'malicious', 'critical')),
  mitre_tactics TEXT[],
  mitre_techniques TEXT[],
  analysis_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  detection_rules_triggered JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'blocked', 'quarantined', 'whitelisted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real-time EDR alerts table
CREATE TABLE public.edr_realtime_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_id UUID REFERENCES public.safe_shield_endpoints(id),
  behavioral_analysis_id UUID REFERENCES public.edr_behavioral_analysis(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  attack_stage TEXT CHECK (attack_stage IN ('reconnaissance', 'initial_access', 'execution', 'persistence', 'privilege_escalation', 'defense_evasion', 'credential_access', 'discovery', 'lateral_movement', 'collection', 'exfiltration', 'impact')),
  indicators_of_compromise JSONB DEFAULT '[]',
  response_actions_taken JSONB DEFAULT '[]',
  auto_response_enabled BOOLEAN DEFAULT true,
  containment_status TEXT DEFAULT 'none' CHECK (containment_status IN ('none', 'process_blocked', 'network_isolated', 'endpoint_quarantined')),
  analyst_assigned UUID,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'confirmed', 'false_positive', 'resolved')),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create machine learning models tracking table
CREATE TABLE public.edr_ml_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL CHECK (model_type IN ('anomaly_detection', 'malware_classification', 'behavior_analysis', 'network_analysis')),
  model_version TEXT NOT NULL,
  accuracy_score DECIMAL(5,2),
  false_positive_rate DECIMAL(5,2),
  training_data_size INTEGER,
  last_trained TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  model_parameters JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edr_behavioral_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edr_realtime_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edr_ml_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own threat intelligence data"
ON public.threat_intelligence FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own EDR behavioral analysis"
ON public.edr_behavioral_analysis FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own EDR alerts"
ON public.edr_realtime_alerts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Everyone can read ML models"
ON public.edr_ml_models FOR SELECT USING (true);

CREATE POLICY "System can manage ML models"
ON public.edr_ml_models FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update ML models"
ON public.edr_ml_models FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_threat_intelligence_user_id ON public.threat_intelligence(user_id);
CREATE INDEX idx_threat_intelligence_indicator ON public.threat_intelligence(indicator_value);
CREATE INDEX idx_threat_intelligence_reputation ON public.threat_intelligence(reputation);
CREATE INDEX idx_threat_intelligence_created_at ON public.threat_intelligence(created_at);

CREATE INDEX idx_edr_behavioral_analysis_user_id ON public.edr_behavioral_analysis(user_id);
CREATE INDEX idx_edr_behavioral_analysis_endpoint_id ON public.edr_behavioral_analysis(endpoint_id);
CREATE INDEX idx_edr_behavioral_analysis_behavior_score ON public.edr_behavioral_analysis(behavior_score);
CREATE INDEX idx_edr_behavioral_analysis_threat_classification ON public.edr_behavioral_analysis(threat_classification);
CREATE INDEX idx_edr_behavioral_analysis_timestamp ON public.edr_behavioral_analysis(analysis_timestamp);

CREATE INDEX idx_edr_realtime_alerts_user_id ON public.edr_realtime_alerts(user_id);
CREATE INDEX idx_edr_realtime_alerts_severity ON public.edr_realtime_alerts(severity);
CREATE INDEX idx_edr_realtime_alerts_status ON public.edr_realtime_alerts(status);
CREATE INDEX idx_edr_realtime_alerts_created_at ON public.edr_realtime_alerts(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_threat_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_edr_behavioral_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_edr_realtime_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_threat_intelligence_updated_at
  BEFORE UPDATE ON public.threat_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_threat_intelligence_updated_at();

CREATE TRIGGER update_edr_behavioral_analysis_updated_at
  BEFORE UPDATE ON public.edr_behavioral_analysis  
  FOR EACH ROW
  EXECUTE FUNCTION public.update_edr_behavioral_analysis_updated_at();

CREATE TRIGGER update_edr_realtime_alerts_updated_at
  BEFORE UPDATE ON public.edr_realtime_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_edr_realtime_alerts_updated_at();