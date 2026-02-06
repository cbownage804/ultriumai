
-- =============================================
-- VANGUARD RECON: Pentest & Vulnerability Scanner
-- =============================================

-- Pentest Engagements
CREATE TABLE public.recon_pentest_engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  engagement_name TEXT NOT NULL,
  description TEXT,
  client_id TEXT,
  engagement_type TEXT NOT NULL DEFAULT 'internal' CHECK (engagement_type IN ('internal', 'external', 'wireless', 'web_app', 'social_engineering', 'full_scope')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'scoping', 'active', 'paused', 'reporting', 'completed', 'archived')),
  scope_targets JSONB DEFAULT '[]'::jsonb,
  scope_exclusions JSONB DEFAULT '[]'::jsonb,
  rules_of_engagement TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  assigned_recon_unit_id UUID REFERENCES vanguard_agents(id),
  findings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  info_count INTEGER DEFAULT 0,
  overall_risk_score NUMERIC(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_pentest_engagements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own engagements" ON public.recon_pentest_engagements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scan Jobs
CREATE TABLE public.recon_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  engagement_id UUID REFERENCES recon_pentest_engagements(id) ON DELETE CASCADE,
  recon_unit_id UUID REFERENCES vanguard_agents(id),
  scan_name TEXT NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('port_scan', 'vuln_scan', 'service_enum', 'os_detection', 'credential_check', 'smb_enum', 'web_scan', 'ssl_audit', 'dns_enum', 'full_pentest', 'custom')),
  scan_profile TEXT DEFAULT 'standard' CHECK (scan_profile IN ('stealth', 'standard', 'aggressive', 'custom')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'dispatched', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  port_range TEXT DEFAULT '1-1024',
  scan_config JSONB DEFAULT '{}'::jsonb,
  progress_percent INTEGER DEFAULT 0,
  hosts_total INTEGER DEFAULT 0,
  hosts_scanned INTEGER DEFAULT 0,
  services_found INTEGER DEFAULT 0,
  vulns_found INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  error_message TEXT,
  raw_output JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_scan_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scan jobs" ON public.recon_scan_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vulnerability Findings
CREATE TABLE public.recon_vulnerability_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  engagement_id UUID REFERENCES recon_pentest_engagements(id) ON DELETE CASCADE,
  scan_job_id UUID REFERENCES recon_scan_jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  cvss_score NUMERIC(3,1) DEFAULT 0,
  cvss_vector TEXT,
  cve_ids TEXT[] DEFAULT '{}',
  cwe_id TEXT,
  affected_host TEXT NOT NULL,
  affected_port INTEGER,
  affected_service TEXT,
  affected_protocol TEXT DEFAULT 'tcp',
  proof_of_concept TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  remediation TEXT,
  remediation_effort TEXT CHECK (remediation_effort IN ('trivial', 'simple', 'moderate', 'complex', 'architectural')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'in_remediation', 'remediated', 'accepted_risk', 'false_positive')),
  verified_at TIMESTAMPTZ,
  remediated_at TIMESTAMPTZ,
  compliance_frameworks TEXT[] DEFAULT '{}',
  attack_vector TEXT,
  exploitability TEXT CHECK (exploitability IN ('none', 'theoretical', 'poc_available', 'weaponized', 'actively_exploited')),
  reference_links JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_vulnerability_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own findings" ON public.recon_vulnerability_findings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Discovered Services
CREATE TABLE public.recon_discovered_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scan_job_id UUID REFERENCES recon_scan_jobs(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES recon_pentest_engagements(id) ON DELETE CASCADE,
  host_ip TEXT NOT NULL,
  hostname TEXT,
  port INTEGER NOT NULL,
  protocol TEXT DEFAULT 'tcp',
  service_name TEXT,
  service_version TEXT,
  product TEXT,
  os_guess TEXT,
  banner TEXT,
  state TEXT DEFAULT 'open' CHECK (state IN ('open', 'closed', 'filtered', 'open|filtered')),
  ssl_info JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_discovered_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own services" ON public.recon_discovered_services FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Scan Schedules
CREATE TABLE public.recon_scan_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  schedule_name TEXT NOT NULL,
  recon_unit_id UUID REFERENCES vanguard_agents(id),
  scan_type TEXT NOT NULL,
  scan_config JSONB DEFAULT '{}'::jsonb,
  targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly')),
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_job_id UUID REFERENCES recon_scan_jobs(id),
  is_active BOOLEAN DEFAULT true,
  notification_emails TEXT[] DEFAULT '{}',
  auto_create_tickets BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_scan_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own schedules" ON public.recon_scan_schedules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Remediation Tracking
CREATE TABLE public.recon_remediation_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  finding_id UUID NOT NULL REFERENCES recon_vulnerability_findings(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES recon_pentest_engagements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'verified', 'wont_fix')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verification_scan_id UUID REFERENCES recon_scan_jobs(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_remediation_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own remediation tasks" ON public.recon_remediation_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Report Templates
CREATE TABLE public.recon_report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  template_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('executive_summary', 'technical_detail', 'compliance', 'remediation_plan', 'retest_validation')),
  sections JSONB DEFAULT '[]'::jsonb,
  branding JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recon_report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON public.recon_report_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_recon_engagements_user ON public.recon_pentest_engagements(user_id);
CREATE INDEX idx_recon_engagements_status ON public.recon_pentest_engagements(status);
CREATE INDEX idx_recon_scan_jobs_user ON public.recon_scan_jobs(user_id);
CREATE INDEX idx_recon_scan_jobs_engagement ON public.recon_scan_jobs(engagement_id);
CREATE INDEX idx_recon_scan_jobs_status ON public.recon_scan_jobs(status);
CREATE INDEX idx_recon_findings_user ON public.recon_vulnerability_findings(user_id);
CREATE INDEX idx_recon_findings_engagement ON public.recon_vulnerability_findings(engagement_id);
CREATE INDEX idx_recon_findings_severity ON public.recon_vulnerability_findings(severity);
CREATE INDEX idx_recon_findings_status ON public.recon_vulnerability_findings(status);
CREATE INDEX idx_recon_findings_host ON public.recon_vulnerability_findings(affected_host);
CREATE INDEX idx_recon_services_job ON public.recon_discovered_services(scan_job_id);
CREATE INDEX idx_recon_services_host ON public.recon_discovered_services(host_ip);
CREATE INDEX idx_recon_remediation_finding ON public.recon_remediation_tasks(finding_id);
CREATE INDEX idx_recon_schedules_next ON public.recon_scan_schedules(next_run_at) WHERE is_active = true;

-- Triggers
CREATE TRIGGER update_recon_engagements_updated_at BEFORE UPDATE ON public.recon_pentest_engagements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recon_scan_jobs_updated_at BEFORE UPDATE ON public.recon_scan_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recon_findings_updated_at BEFORE UPDATE ON public.recon_vulnerability_findings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recon_schedules_updated_at BEFORE UPDATE ON public.recon_scan_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recon_remediation_updated_at BEFORE UPDATE ON public.recon_remediation_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recon_templates_updated_at BEFORE UPDATE ON public.recon_report_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
