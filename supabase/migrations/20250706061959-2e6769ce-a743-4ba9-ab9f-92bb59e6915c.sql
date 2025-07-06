-- Create compliance data storage tables
CREATE TABLE public.compliance_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_type TEXT NOT NULL, -- 'domain_controller', 'microsoft_365', 'google_workspace', 'aws', 'azure', 'security_tools'
  connector_name TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'error', 'connecting'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT NOT NULL DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID NOT NULL REFERENCES public.compliance_connectors(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- 'user_access', 'security_policy', 'network_config', 'file_permissions', etc.
  data_source TEXT NOT NULL, -- specific source within connector
  raw_data JSONB NOT NULL,
  processed_data JSONB,
  compliance_status TEXT, -- 'compliant', 'non_compliant', 'needs_review'
  risk_level TEXT, -- 'low', 'medium', 'high', 'critical'
  framework_mappings JSONB DEFAULT '{}', -- which frameworks this data applies to
  evidence_collected BOOLEAN DEFAULT false,
  evidence_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  framework TEXT NOT NULL, -- 'soc2', 'hipaa', 'pci_dss', etc.
  control_id TEXT NOT NULL, -- specific control identifier
  evidence_type TEXT NOT NULL, -- 'screenshot', 'configuration', 'log', 'document'
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  collected_by TEXT, -- 'automatic', 'manual', or user identifier
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'policy_violation', 'control_failure', 'risk_detected'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source_connector_id UUID REFERENCES public.compliance_connectors(id),
  source_data_id UUID REFERENCES public.compliance_data(id),
  framework TEXT,
  control_id TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'false_positive'
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own compliance connectors" 
ON public.compliance_connectors FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own compliance data" 
ON public.compliance_data FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own compliance evidence" 
ON public.compliance_evidence FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own compliance alerts" 
ON public.compliance_alerts FOR ALL 
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_compliance_connectors_user_id ON public.compliance_connectors(user_id);
CREATE INDEX idx_compliance_connectors_status ON public.compliance_connectors(status);
CREATE INDEX idx_compliance_data_user_id ON public.compliance_data(user_id);
CREATE INDEX idx_compliance_data_connector_id ON public.compliance_data(connector_id);
CREATE INDEX idx_compliance_data_type ON public.compliance_data(data_type);
CREATE INDEX idx_compliance_evidence_user_id ON public.compliance_evidence(user_id);
CREATE INDEX idx_compliance_evidence_framework ON public.compliance_evidence(framework);
CREATE INDEX idx_compliance_alerts_user_id ON public.compliance_alerts(user_id);
CREATE INDEX idx_compliance_alerts_status ON public.compliance_alerts(status);
CREATE INDEX idx_compliance_alerts_severity ON public.compliance_alerts(severity);

-- Create updated_at triggers
CREATE TRIGGER update_compliance_connectors_updated_at
  BEFORE UPDATE ON public.compliance_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_data_updated_at
  BEFORE UPDATE ON public.compliance_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_alerts_updated_at
  BEFORE UPDATE ON public.compliance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();