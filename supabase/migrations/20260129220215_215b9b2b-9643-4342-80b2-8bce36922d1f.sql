-- Vanguard Fleet/Helpdesk Enhancement Tables (only new ones)

-- Patch Management
CREATE TABLE IF NOT EXISTS public.vanguard_patches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kb_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'important', 'moderate', 'low')),
  category TEXT NOT NULL CHECK (category IN ('security', 'feature', 'driver', 'definition', 'other')),
  size_mb NUMERIC(10,2),
  release_date DATE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'approved', 'declined', 'installed', 'failed', 'pending_reboot')),
  affected_devices INTEGER DEFAULT 0,
  installed_devices INTEGER DEFAULT 0,
  cve_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_patches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own patches" ON public.vanguard_patches;
CREATE POLICY "Users can manage their own patches" ON public.vanguard_patches
  FOR ALL USING (auth.uid() = user_id);

-- Ticket Workflow Rules
CREATE TABLE IF NOT EXISTS public.vanguard_workflow_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('ticket_created', 'status_changed', 'priority_changed', 'sla_warning', 'time_elapsed')),
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_workflow_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own workflow rules" ON public.vanguard_workflow_rules;
CREATE POLICY "Users can manage their own workflow rules" ON public.vanguard_workflow_rules
  FOR ALL USING (auth.uid() = user_id);

-- Escalation Rules
CREATE TABLE IF NOT EXISTS public.vanguard_escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  response_timeout_minutes INTEGER NOT NULL,
  resolution_timeout_minutes INTEGER NOT NULL,
  escalation_path TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_escalation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own escalation rules" ON public.vanguard_escalation_rules;
CREATE POLICY "Users can manage their own escalation rules" ON public.vanguard_escalation_rules
  FOR ALL USING (auth.uid() = user_id);

-- CSAT Survey Templates
CREATE TABLE IF NOT EXISTS public.vanguard_survey_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('ticket_resolved', 'after_response', 'manual')),
  questions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  response_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_survey_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own survey templates" ON public.vanguard_survey_templates;
CREATE POLICY "Users can manage their own survey templates" ON public.vanguard_survey_templates
  FOR ALL USING (auth.uid() = user_id);

-- CSAT Survey Responses  
CREATE TABLE IF NOT EXISTS public.vanguard_survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.vanguard_survey_templates(id) ON DELETE SET NULL,
  ticket_id UUID,
  ticket_title TEXT,
  client_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  feedback TEXT,
  technician_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own survey responses" ON public.vanguard_survey_responses;
CREATE POLICY "Users can manage their own survey responses" ON public.vanguard_survey_responses
  FOR ALL USING (auth.uid() = user_id);

-- SLA/Uptime Policies
CREATE TABLE IF NOT EXISTS public.vanguard_uptime_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  client_id UUID,
  client_name TEXT,
  uptime_target NUMERIC(5,2) NOT NULL DEFAULT 99.9,
  response_time_target INTEGER,
  resolution_time_target INTEGER,
  maintenance_window JSONB,
  breach_notifications TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_uptime_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own uptime policies" ON public.vanguard_uptime_policies;
CREATE POLICY "Users can manage their own uptime policies" ON public.vanguard_uptime_policies
  FOR ALL USING (auth.uid() = user_id);

-- Uptime Records
CREATE TABLE IF NOT EXISTS public.vanguard_uptime_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  client_name TEXT,
  current_uptime NUMERIC(6,3),
  last_30_days_uptime NUMERIC(6,3),
  last_downtime_at TIMESTAMP WITH TIME ZONE,
  downtime_minutes_30d INTEGER DEFAULT 0,
  incidents_30d INTEGER DEFAULT 0,
  sla_target NUMERIC(5,2),
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_uptime_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own uptime records" ON public.vanguard_uptime_records;
CREATE POLICY "Users can manage their own uptime records" ON public.vanguard_uptime_records
  FOR ALL USING (auth.uid() = user_id);

-- SLA Breaches
CREATE TABLE IF NOT EXISTS public.vanguard_sla_breaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  client_name TEXT,
  breach_type TEXT NOT NULL CHECK (breach_type IN ('uptime', 'response', 'resolution')),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  target_value NUMERIC(10,2),
  actual_value NUMERIC(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
  ticket_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_sla_breaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own SLA breaches" ON public.vanguard_sla_breaches;
CREATE POLICY "Users can manage their own SLA breaches" ON public.vanguard_sla_breaches
  FOR ALL USING (auth.uid() = user_id);

-- Endpoint Compliance Records
CREATE TABLE IF NOT EXISTS public.vanguard_endpoint_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  os TEXT,
  overall_score INTEGER DEFAULT 0,
  cis_score INTEGER DEFAULT 0,
  encryption_status TEXT CHECK (encryption_status IN ('encrypted', 'partial', 'not_encrypted')),
  av_status TEXT CHECK (av_status IN ('active', 'outdated', 'disabled')),
  firewall_status TEXT CHECK (firewall_status IN ('enabled', 'disabled', 'partial')),
  patch_score INTEGER DEFAULT 0,
  compliance_checks JSONB DEFAULT '[]'::jsonb,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_endpoint_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own endpoint compliance" ON public.vanguard_endpoint_compliance;
CREATE POLICY "Users can manage their own endpoint compliance" ON public.vanguard_endpoint_compliance
  FOR ALL USING (auth.uid() = user_id);

-- Asset Lifecycle Records
CREATE TABLE IF NOT EXISTS public.vanguard_asset_lifecycle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('workstation', 'server', 'laptop', 'network', 'peripheral', 'mobile')),
  serial_number TEXT,
  manufacturer TEXT,
  model TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(12,2),
  vendor TEXT,
  warranty_expiry DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'disposed')),
  assigned_to TEXT,
  location TEXT,
  depreciation_method TEXT DEFAULT 'straight-line' CHECK (depreciation_method IN ('straight-line', 'declining-balance')),
  useful_life_years INTEGER DEFAULT 5,
  salvage_value NUMERIC(12,2) DEFAULT 0,
  last_maintenance_date DATE,
  eol_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_asset_lifecycle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own asset lifecycle" ON public.vanguard_asset_lifecycle;
CREATE POLICY "Users can manage their own asset lifecycle" ON public.vanguard_asset_lifecycle
  FOR ALL USING (auth.uid() = user_id);

-- Software Audit Records
CREATE TABLE IF NOT EXISTS public.vanguard_software_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  version TEXT,
  publisher TEXT,
  category TEXT,
  device_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  has_vulnerabilities BOOLEAN DEFAULT false,
  vulnerability_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_software_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own software audit" ON public.vanguard_software_audit;
CREATE POLICY "Users can manage their own software audit" ON public.vanguard_software_audit
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_vanguard_patches_user_id ON public.vanguard_patches(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_patches_status ON public.vanguard_patches(status);
CREATE INDEX IF NOT EXISTS idx_vanguard_workflow_rules_user_id ON public.vanguard_workflow_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_escalation_rules_user_id ON public.vanguard_escalation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_survey_responses_user_id ON public.vanguard_survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_uptime_records_user_id ON public.vanguard_uptime_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_endpoint_compliance_user_id ON public.vanguard_endpoint_compliance(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_asset_lifecycle_user_id ON public.vanguard_asset_lifecycle(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_software_audit_user_id ON public.vanguard_software_audit(user_id);