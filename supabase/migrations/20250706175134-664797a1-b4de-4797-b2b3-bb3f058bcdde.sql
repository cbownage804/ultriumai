-- Rename UltriumShield tables to SafeShield for SafeSuite branding
ALTER TABLE public.ultrium_shield_endpoints RENAME TO safe_shield_endpoints;
ALTER TABLE public.ultrium_shield_threats RENAME TO safe_shield_threats;
ALTER TABLE public.ultrium_shield_actions RENAME TO safe_shield_actions;

-- Update indexes to match new table names
DROP INDEX IF EXISTS idx_ultrium_endpoints_user_id;
DROP INDEX IF EXISTS idx_ultrium_endpoints_status;
DROP INDEX IF EXISTS idx_ultrium_threats_user_id;
DROP INDEX IF EXISTS idx_ultrium_threats_severity;
DROP INDEX IF EXISTS idx_ultrium_threats_detected_at;
DROP INDEX IF EXISTS idx_ultrium_actions_user_id;
DROP INDEX IF EXISTS idx_endpoints_client_id;
DROP INDEX IF EXISTS idx_threats_client_id;

CREATE INDEX idx_safe_shield_endpoints_user_id ON public.safe_shield_endpoints(user_id);
CREATE INDEX idx_safe_shield_endpoints_status ON public.safe_shield_endpoints(status);
CREATE INDEX idx_safe_shield_threats_user_id ON public.safe_shield_threats(user_id);
CREATE INDEX idx_safe_shield_threats_severity ON public.safe_shield_threats(severity);
CREATE INDEX idx_safe_shield_threats_detected_at ON public.safe_shield_threats(detected_at);
CREATE INDEX idx_safe_shield_actions_user_id ON public.safe_shield_actions(user_id);
CREATE INDEX idx_safe_shield_endpoints_client_id ON public.safe_shield_endpoints(msp_client_id);
CREATE INDEX idx_safe_shield_threats_client_id ON public.safe_shield_threats(msp_client_id);

-- Add new tables for SafeAV (Antivirus) functionality
CREATE TABLE public.safe_av_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_id UUID,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('quick', 'full', 'custom', 'real_time')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  files_scanned INTEGER DEFAULT 0,
  threats_found INTEGER DEFAULT 0,
  threats_quarantined INTEGER DEFAULT 0,
  scan_results JSONB DEFAULT '{}',
  scan_path TEXT,
  scan_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.safe_av_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  definition_version TEXT NOT NULL,
  update_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_signatures INTEGER DEFAULT 0,
  engine_version TEXT,
  update_status TEXT NOT NULL DEFAULT 'current',
  next_update_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new tables for SafeMDR (Managed Detection & Response) functionality
CREATE TABLE public.safe_mdr_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_client_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_system TEXT,
  affected_assets TEXT[],
  tactics JSONB DEFAULT '[]',
  techniques JSONB DEFAULT '[]',
  indicators JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'confirmed', 'false_positive', 'resolved')),
  assigned_to UUID,
  escalation_level INTEGER DEFAULT 0,
  response_actions JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  remediation_steps TEXT,
  analyst_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.safe_mdr_investigations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  investigator_id UUID,
  investigation_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  evidence_collected JSONB DEFAULT '[]',
  findings TEXT,
  recommendations TEXT,
  investigation_status TEXT NOT NULL DEFAULT 'open',
  time_spent_minutes INTEGER DEFAULT 0,
  tools_used TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Add billing and SLA tables for MSP features
CREATE TABLE public.msp_service_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  response_time_minutes INTEGER DEFAULT 60,
  resolution_time_hours INTEGER DEFAULT 24,
  availability_percentage DECIMAL(5,2) DEFAULT 99.9,
  monthly_fee DECIMAL(10,2),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.msp_billing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  base_amount DECIMAL(10,2) DEFAULT 0,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  invoice_number TEXT,
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add real-time monitoring tables
CREATE TABLE public.safe_shield_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_id UUID,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_threshold_exceeded BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE public.threat_intelligence_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  indicators JSONB DEFAULT '[]',
  threat_actors JSONB DEFAULT '[]',
  campaigns JSONB DEFAULT '[]',
  confidence_score INTEGER DEFAULT 75,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on all new tables
ALTER TABLE public.safe_av_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_av_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_shield_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence_feeds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own AV scans" ON public.safe_av_scans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own AV definitions" ON public.safe_av_definitions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own MDR alerts" ON public.safe_mdr_alerts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own MDR investigations" ON public.safe_mdr_investigations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "MSPs can manage their service agreements" ON public.msp_service_agreements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "MSPs can manage their billing records" ON public.msp_billing_records FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their monitoring data" ON public.safe_shield_monitoring FOR ALL USING (user_id = auth.uid());
CREATE POLICY "System can manage threat intelligence" ON public.threat_intelligence_feeds FOR ALL USING (true);

-- Add indexes for performance
CREATE INDEX idx_safe_av_scans_user_id ON public.safe_av_scans(user_id);
CREATE INDEX idx_safe_av_scans_endpoint_id ON public.safe_av_scans(endpoint_id);
CREATE INDEX idx_safe_av_scans_status ON public.safe_av_scans(status);
CREATE INDEX idx_safe_mdr_alerts_user_id ON public.safe_mdr_alerts(user_id);
CREATE INDEX idx_safe_mdr_alerts_severity ON public.safe_mdr_alerts(severity);
CREATE INDEX idx_safe_mdr_alerts_status ON public.safe_mdr_alerts(status);
CREATE INDEX idx_msp_billing_client_id ON public.msp_billing_records(client_id);
CREATE INDEX idx_safe_shield_monitoring_endpoint_id ON public.safe_shield_monitoring(endpoint_id);
CREATE INDEX idx_safe_shield_monitoring_timestamp ON public.safe_shield_monitoring(timestamp);

-- Add triggers for updated_at columns
CREATE TRIGGER update_safe_av_scans_updated_at
  BEFORE UPDATE ON public.safe_av_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_safe_av_definitions_updated_at
  BEFORE UPDATE ON public.safe_av_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_safe_mdr_alerts_updated_at
  BEFORE UPDATE ON public.safe_mdr_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_safe_mdr_investigations_updated_at
  BEFORE UPDATE ON public.safe_mdr_investigations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_msp_service_agreements_updated_at
  BEFORE UPDATE ON public.msp_service_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_msp_billing_records_updated_at
  BEFORE UPDATE ON public.msp_billing_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();