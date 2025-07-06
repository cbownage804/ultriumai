-- MSP Client Management System
CREATE TABLE IF NOT EXISTS public.msp_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  subscription_tier TEXT DEFAULT 'standard' CHECK (subscription_tier IN ('basic', 'standard', 'premium', 'enterprise')),
  max_endpoints INTEGER DEFAULT 50,
  billing_contact TEXT,
  technical_contact TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  white_label_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MSP Client Endpoints (extends safe_shield_endpoints for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.msp_client_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_org_id UUID NOT NULL REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.safe_shield_endpoints(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  location TEXT,
  department TEXT,
  assigned_technician UUID,
  sla_tier TEXT DEFAULT 'standard' CHECK (sla_tier IN ('basic', 'standard', 'premium', 'critical')),
  monitoring_level TEXT DEFAULT 'full' CHECK (monitoring_level IN ('basic', 'full', 'advanced')),
  compliance_requirements TEXT[] DEFAULT '{}',
  billing_rate DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- API Access Keys for external integrations
CREATE TABLE IF NOT EXISTS public.security_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "admin": false}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  allowed_ips TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  scopes TEXT[] DEFAULT '{"endpoints", "threats", "alerts"}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automated Response Workflows
CREATE TABLE IF NOT EXISTS public.response_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  max_executions_per_hour INTEGER DEFAULT 10,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  success_rate DECIMAL(5,2) DEFAULT 100.00,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mobile Device Registrations for Push Notifications
CREATE TABLE IF NOT EXISTS public.mobile_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  app_version TEXT,
  os_version TEXT,
  notification_preferences JSONB DEFAULT '{"critical": true, "high": true, "medium": false, "low": false}',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance Framework Mappings
CREATE TABLE IF NOT EXISTS public.compliance_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_name TEXT NOT NULL,
  version TEXT,
  description TEXT,
  requirements JSONB NOT NULL,
  automated_checks JSONB DEFAULT '{}',
  evidence_requirements JSONB DEFAULT '{}',
  reporting_schedule TEXT DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance Status Tracking
CREATE TABLE IF NOT EXISTS public.compliance_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_org_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES public.compliance_frameworks(id),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('compliant', 'non_compliant', 'in_progress', 'needs_review')),
  score DECIMAL(5,2),
  requirements_met INTEGER DEFAULT 0,
  total_requirements INTEGER DEFAULT 0,
  evidence_collected JSONB DEFAULT '{}',
  last_audit_date TIMESTAMP WITH TIME ZONE,
  next_audit_date TIMESTAMP WITH TIME ZONE,
  assigned_auditor UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.msp_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_client_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own MSP organizations" ON public.msp_organizations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "MSP can manage their client endpoints" ON public.msp_client_endpoints
  FOR ALL USING (msp_org_id IN (SELECT id FROM public.msp_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own API keys" ON public.security_api_keys
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own workflows" ON public.response_workflows
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own mobile devices" ON public.mobile_devices
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Everyone can read compliance frameworks" ON public.compliance_frameworks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own compliance status" ON public.compliance_status
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_msp_organizations_user_id ON public.msp_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_msp_organizations_status ON public.msp_organizations(status);

CREATE INDEX IF NOT EXISTS idx_msp_client_endpoints_msp_org_id ON public.msp_client_endpoints(msp_org_id);
CREATE INDEX IF NOT EXISTS idx_msp_client_endpoints_endpoint_id ON public.msp_client_endpoints(endpoint_id);

CREATE INDEX IF NOT EXISTS idx_security_api_keys_user_id ON public.security_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_security_api_keys_key_hash ON public.security_api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_response_workflows_user_id ON public.response_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_response_workflows_is_active ON public.response_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_id ON public.mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_device_token ON public.mobile_devices(device_token);

CREATE INDEX IF NOT EXISTS idx_compliance_status_user_id ON public.compliance_status(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_framework_id ON public.compliance_status(framework_id);

-- Enable realtime
ALTER TABLE public.msp_organizations REPLICA IDENTITY FULL;
ALTER TABLE public.msp_client_endpoints REPLICA IDENTITY FULL;
ALTER TABLE public.response_workflows REPLICA IDENTITY FULL;
ALTER TABLE public.mobile_devices REPLICA IDENTITY FULL;
ALTER TABLE public.compliance_status REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.msp_organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.msp_client_endpoints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.response_workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_status;

-- Insert sample compliance frameworks
INSERT INTO public.compliance_frameworks (framework_name, version, description, requirements) VALUES
('SOC 2 Type II', '2023', 'Service Organization Control 2 Type II certification requirements', 
 '{"security": {"access_controls": true, "encryption": true, "monitoring": true}, "availability": {"uptime": 99.9, "disaster_recovery": true}, "confidentiality": {"data_classification": true, "access_logging": true}}'),
('ISO 27001', '2022', 'International Organization for Standardization 27001 Information Security Management', 
 '{"risk_management": true, "security_policies": true, "incident_response": true, "access_control": true, "cryptography": true}'),
('NIST Cybersecurity Framework', '1.1', 'National Institute of Standards and Technology Cybersecurity Framework',
 '{"identify": {"asset_management": true, "risk_assessment": true}, "protect": {"access_control": true, "data_security": true}, "detect": {"continuous_monitoring": true, "detection_processes": true}, "respond": {"incident_response": true, "communications": true}, "recover": {"recovery_planning": true, "improvements": true}}'),
('GDPR', '2018', 'General Data Protection Regulation compliance requirements',
 '{"lawful_basis": true, "data_minimization": true, "consent_management": true, "breach_notification": true, "privacy_by_design": true}');