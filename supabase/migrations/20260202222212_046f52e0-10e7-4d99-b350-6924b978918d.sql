-- =====================================================
-- VANGUARD HORIZON PRODUCTION TABLES
-- Complete database schema for all Horizon RMM modules
-- =====================================================

-- 1. THREAT HUNTING & EDR
-- =====================================================

-- Threat hunting queries and results
CREATE TABLE IF NOT EXISTS public.horizon_threat_hunts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hunt_name TEXT NOT NULL,
  hunt_type TEXT NOT NULL DEFAULT 'ioc', -- ioc, behavioral, memory, network
  query_parameters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  results_count INTEGER DEFAULT 0,
  findings JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vulnerability scan results
CREATE TABLE IF NOT EXISTS public.horizon_vulnerability_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'full', -- full, quick, targeted
  status TEXT NOT NULL DEFAULT 'pending',
  total_vulnerabilities INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  vulnerabilities JSONB DEFAULT '[]',
  scan_duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security baselines and compliance
CREATE TABLE IF NOT EXISTS public.horizon_security_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  baseline_name TEXT NOT NULL,
  baseline_type TEXT NOT NULL DEFAULT 'cis', -- cis, nist, custom
  framework_version TEXT,
  is_active BOOLEAN DEFAULT true,
  policy_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Baseline compliance results per agent
CREATE TABLE IF NOT EXISTS public.horizon_baseline_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baseline_id UUID NOT NULL REFERENCES public.horizon_security_baselines(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  compliance_score NUMERIC(5,2) DEFAULT 0,
  passed_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  check_results JSONB DEFAULT '[]',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incident response playbooks
CREATE TABLE IF NOT EXISTS public.horizon_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  playbook_name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- manual, alert, threshold
  trigger_conditions JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playbook execution logs
CREATE TABLE IF NOT EXISTS public.horizon_playbook_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.horizon_playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
  trigger_source TEXT,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, cancelled
  steps_completed INTEGER DEFAULT 0,
  execution_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. REMOTE ACCESS & FILE TRANSFER
-- =====================================================

-- File transfer requests and history
CREATE TABLE IF NOT EXISTS public.horizon_file_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- upload, download
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, transferring, completed, failed
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,
  storage_url TEXT,
  checksum TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wake-on-LAN requests
CREATE TABLE IF NOT EXISTS public.horizon_wol_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_mac_address TEXT NOT NULL,
  target_device_name TEXT,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL, -- Scanner agent
  broadcast_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, confirmed, failed
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ACCESS CONTROL & MULTI-TENANCY
-- =====================================================

-- Tenants (for multi-tenant isolation)
CREATE TABLE IF NOT EXISTS public.horizon_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant memberships
CREATE TABLE IF NOT EXISTS public.horizon_tenant_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.horizon_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_id UUID, -- References horizon_roles
  status TEXT NOT NULL DEFAULT 'active', -- active, invited, suspended
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Roles for RBAC
CREATE TABLE IF NOT EXISTS public.horizon_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Owner of the role definition
  tenant_id UUID REFERENCES public.horizon_tenants(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Technician activity logs
CREATE TABLE IF NOT EXISTS public.horizon_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.horizon_tenants(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REPORTING & ANALYTICS
-- =====================================================

-- Scheduled report configurations
CREATE TABLE IF NOT EXISTS public.horizon_scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.horizon_tenants(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- executive, sla, security, asset, custom
  schedule_cron TEXT NOT NULL, -- Cron expression
  recipients JSONB NOT NULL DEFAULT '[]', -- Email addresses
  format TEXT NOT NULL DEFAULT 'pdf', -- pdf, csv, excel
  filters JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated report history
CREATE TABLE IF NOT EXISTS public.horizon_report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_report_id UUID REFERENCES public.horizon_scheduled_reports(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  generation_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'generating', -- generating, completed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- White-label branding configurations
CREATE TABLE IF NOT EXISTS public.horizon_white_label (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.horizon_tenants(id) ON DELETE CASCADE,
  company_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  accent_color TEXT DEFAULT '#06b6d4',
  font_family TEXT DEFAULT 'Inter',
  custom_css TEXT,
  email_footer TEXT,
  report_footer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SLA tracking metrics
CREATE TABLE IF NOT EXISTS public.horizon_sla_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.horizon_tenants(id) ON DELETE CASCADE,
  client_id UUID,
  metric_date DATE NOT NULL,
  total_tickets INTEGER DEFAULT 0,
  tickets_within_response_sla INTEGER DEFAULT 0,
  tickets_within_resolution_sla INTEGER DEFAULT 0,
  avg_response_time_minutes NUMERIC(10,2),
  avg_resolution_time_minutes NUMERIC(10,2),
  uptime_percent NUMERIC(5,2),
  incidents_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id, metric_date)
);

-- 5. INTEGRATIONS
-- =====================================================

-- External PSA/RMM sync status
CREATE TABLE IF NOT EXISTS public.horizon_integration_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_type TEXT NOT NULL, -- connectwise, autotask, halopsa, etc.
  sync_direction TEXT NOT NULL, -- inbound, outbound, bidirectional
  entity_type TEXT NOT NULL, -- tickets, devices, contacts, etc.
  status TEXT NOT NULL DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.horizon_threat_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_vulnerability_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_security_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_baseline_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_playbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_wol_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_white_label ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_sla_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horizon_integration_syncs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - User owns their data
-- =====================================================

-- Threat Hunts
CREATE POLICY "Users manage own threat hunts" ON public.horizon_threat_hunts
  FOR ALL USING (auth.uid() = user_id);

-- Vulnerability Scans
CREATE POLICY "Users manage own vuln scans" ON public.horizon_vulnerability_scans
  FOR ALL USING (auth.uid() = user_id);

-- Security Baselines
CREATE POLICY "Users manage own baselines" ON public.horizon_security_baselines
  FOR ALL USING (auth.uid() = user_id);

-- Baseline Results
CREATE POLICY "Users manage own baseline results" ON public.horizon_baseline_results
  FOR ALL USING (auth.uid() = user_id);

-- Playbooks
CREATE POLICY "Users manage own playbooks" ON public.horizon_playbooks
  FOR ALL USING (auth.uid() = user_id);

-- Playbook Executions
CREATE POLICY "Users manage own playbook executions" ON public.horizon_playbook_executions
  FOR ALL USING (auth.uid() = user_id);

-- File Transfers
CREATE POLICY "Users manage own file transfers" ON public.horizon_file_transfers
  FOR ALL USING (auth.uid() = user_id);

-- WoL Requests
CREATE POLICY "Users manage own wol requests" ON public.horizon_wol_requests
  FOR ALL USING (auth.uid() = user_id);

-- Tenants (owner access)
CREATE POLICY "Owners manage own tenants" ON public.horizon_tenants
  FOR ALL USING (auth.uid() = owner_user_id);

-- Tenant Members (tenant owners and members can view)
CREATE POLICY "Users view own memberships" ON public.horizon_tenant_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenant owners manage members" ON public.horizon_tenant_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.horizon_tenants 
      WHERE id = horizon_tenant_members.tenant_id 
      AND owner_user_id = auth.uid()
    )
  );

-- Roles
CREATE POLICY "Users manage own roles" ON public.horizon_roles
  FOR ALL USING (auth.uid() = user_id);

-- Activity Logs
CREATE POLICY "Users view own activity" ON public.horizon_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own activity" ON public.horizon_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scheduled Reports
CREATE POLICY "Users manage own scheduled reports" ON public.horizon_scheduled_reports
  FOR ALL USING (auth.uid() = user_id);

-- Report History
CREATE POLICY "Users manage own report history" ON public.horizon_report_history
  FOR ALL USING (auth.uid() = user_id);

-- White Label
CREATE POLICY "Users manage own white label" ON public.horizon_white_label
  FOR ALL USING (auth.uid() = user_id);

-- SLA Metrics
CREATE POLICY "Users manage own sla metrics" ON public.horizon_sla_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Integration Syncs
CREATE POLICY "Users manage own integration syncs" ON public.horizon_integration_syncs
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_horizon_threat_hunts_user ON public.horizon_threat_hunts(user_id);
CREATE INDEX IF NOT EXISTS idx_horizon_threat_hunts_status ON public.horizon_threat_hunts(status);
CREATE INDEX IF NOT EXISTS idx_horizon_vuln_scans_agent ON public.horizon_vulnerability_scans(agent_id);
CREATE INDEX IF NOT EXISTS idx_horizon_vuln_scans_user ON public.horizon_vulnerability_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_horizon_baselines_user ON public.horizon_security_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_horizon_baseline_results_agent ON public.horizon_baseline_results(agent_id);
CREATE INDEX IF NOT EXISTS idx_horizon_playbooks_user ON public.horizon_playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_horizon_file_transfers_agent ON public.horizon_file_transfers(agent_id);
CREATE INDEX IF NOT EXISTS idx_horizon_wol_mac ON public.horizon_wol_requests(target_mac_address);
CREATE INDEX IF NOT EXISTS idx_horizon_tenants_slug ON public.horizon_tenants(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_horizon_tenant_members_user ON public.horizon_tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_horizon_activity_logs_user ON public.horizon_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_horizon_activity_logs_created ON public.horizon_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_horizon_sla_metrics_date ON public.horizon_sla_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_horizon_reports_next_send ON public.horizon_scheduled_reports(next_send_at) WHERE is_active = true;