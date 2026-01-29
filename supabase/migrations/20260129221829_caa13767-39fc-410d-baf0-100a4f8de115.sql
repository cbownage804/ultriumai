-- ============================================================
-- Vanguard Production Tables - Batch 5
-- Fleet Scripts, Backup Integration, Email Hub, Cost Allocation
-- ============================================================

-- Fleet Script Library tables
CREATE TABLE IF NOT EXISTS public.vanguard_fleet_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Custom',
  script_type TEXT DEFAULT 'powershell',
  content TEXT NOT NULL,
  author TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_builtin BOOLEAN DEFAULT false,
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMP WITH TIME ZONE,
  last_result TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_fleet_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their fleet scripts"
ON public.vanguard_fleet_scripts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_fleet_scripts_user ON public.vanguard_fleet_scripts(user_id);
CREATE INDEX idx_vanguard_fleet_scripts_category ON public.vanguard_fleet_scripts(category);

-- Script Executions tracking
CREATE TABLE IF NOT EXISTS public.vanguard_script_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  script_id UUID REFERENCES public.vanguard_fleet_scripts(id) ON DELETE SET NULL,
  script_name TEXT NOT NULL,
  device_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  target_devices UUID[] DEFAULT '{}',
  output_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_script_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their script executions"
ON public.vanguard_script_executions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_script_executions_user ON public.vanguard_script_executions(user_id);
CREATE INDEX idx_vanguard_script_executions_status ON public.vanguard_script_executions(status);

-- Backup vendor integrations
CREATE TABLE IF NOT EXISTS public.vanguard_backup_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL,
  api_key_configured BOOLEAN DEFAULT false,
  is_connected BOOLEAN DEFAULT false,
  api_endpoint TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  jobs_monitored INTEGER DEFAULT 0,
  config_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_backup_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their backup vendors"
ON public.vanguard_backup_vendors FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_backup_vendors_user ON public.vanguard_backup_vendors(user_id);

-- Backup jobs monitoring
CREATE TABLE IF NOT EXISTS public.vanguard_backup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_id UUID REFERENCES public.vanguard_backup_vendors(id) ON DELETE CASCADE,
  client_id UUID,
  device_name TEXT NOT NULL,
  job_type TEXT DEFAULT 'full',
  status TEXT DEFAULT 'scheduled',
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  size_gb NUMERIC(10,2),
  retention_days INTEGER DEFAULT 30,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_backup_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their backup jobs"
ON public.vanguard_backup_jobs FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_backup_jobs_user ON public.vanguard_backup_jobs(user_id);
CREATE INDEX idx_vanguard_backup_jobs_status ON public.vanguard_backup_jobs(status);

-- Email integration configurations
CREATE TABLE IF NOT EXISTS public.vanguard_email_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_name TEXT NOT NULL,
  inbound_email TEXT NOT NULL,
  outbound_email TEXT NOT NULL,
  imap_server TEXT,
  smtp_server TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_create_ticket BOOLEAN DEFAULT true,
  default_priority TEXT DEFAULT 'medium',
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_email_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their email configs"
ON public.vanguard_email_configs FOR ALL USING (auth.uid() = user_id);

-- Email templates
CREATE TABLE IF NOT EXISTS public.vanguard_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their email templates"
ON public.vanguard_email_templates FOR ALL USING (auth.uid() = user_id);

-- Inbound emails queue
CREATE TABLE IF NOT EXISTS public.vanguard_inbound_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_id UUID REFERENCES public.vanguard_email_configs(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending',
  ticket_id UUID,
  has_attachments BOOLEAN DEFAULT false,
  raw_headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their inbound emails"
ON public.vanguard_inbound_emails FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_inbound_emails_status ON public.vanguard_inbound_emails(status);

-- Cost allocation data per client
CREATE TABLE IF NOT EXISTS public.vanguard_client_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  device_cost NUMERIC(10,2) DEFAULT 0,
  support_hours NUMERIC(8,2) DEFAULT 0,
  support_cost NUMERIC(10,2) DEFAULT 0,
  licensing_cost NUMERIC(10,2) DEFAULT 0,
  infrastructure_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  revenue NUMERIC(10,2) DEFAULT 0,
  margin_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_client_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their client costs"
ON public.vanguard_client_costs FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_client_costs_user ON public.vanguard_client_costs(user_id);
CREATE INDEX idx_vanguard_client_costs_period ON public.vanguard_client_costs(period_start, period_end);

-- Technician utilization tracking
CREATE TABLE IF NOT EXISTS public.vanguard_technician_utilization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technician_name TEXT NOT NULL,
  technician_id UUID,
  period_date DATE NOT NULL,
  billable_hours NUMERIC(6,2) DEFAULT 0,
  non_billable_hours NUMERIC(6,2) DEFAULT 0,
  total_hours NUMERIC(6,2) DEFAULT 0,
  utilization_percent NUMERIC(5,2) DEFAULT 0,
  tickets_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_technician_utilization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their technician utilization"
ON public.vanguard_technician_utilization FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_tech_util_user ON public.vanguard_technician_utilization(user_id);
CREATE INDEX idx_vanguard_tech_util_date ON public.vanguard_technician_utilization(period_date);

-- Client usage snapshots (for billing dashboard)
CREATE TABLE IF NOT EXISTS public.vanguard_client_usage_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  snapshot_date DATE NOT NULL,
  device_count INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_gb NUMERIC(10,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  ticket_count INTEGER DEFAULT 0,
  alert_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_client_usage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their usage snapshots"
ON public.vanguard_client_usage_snapshots FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_vanguard_usage_snapshots_user ON public.vanguard_client_usage_snapshots(user_id);
CREATE INDEX idx_vanguard_usage_snapshots_date ON public.vanguard_client_usage_snapshots(snapshot_date);