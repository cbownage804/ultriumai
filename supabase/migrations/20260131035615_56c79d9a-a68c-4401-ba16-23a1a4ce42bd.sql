-- Add missing columns to existing workflow_automation_rules table
ALTER TABLE public.workflow_automation_rules 
ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visual_config JSONB DEFAULT '{}';

-- =============================================
-- CUSTOMER SELF-SERVICE PORTAL TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.customer_portal_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  portal_name TEXT NOT NULL DEFAULT 'Support Portal',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  welcome_message TEXT DEFAULT 'Welcome to our support portal',
  enable_kb_access BOOLEAN DEFAULT true,
  enable_device_view BOOLEAN DEFAULT true,
  enable_ticket_submission BOOLEAN DEFAULT true,
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portal_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  can_view_all_tickets BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  portal_password_hash TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ASSET-TICKET LINKING TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.ticket_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  asset_id UUID,
  agent_id UUID,
  asset_type TEXT NOT NULL,
  notes TEXT,
  linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  linked_by UUID
);

-- =============================================
-- REMOTE SESSION INTEGRATION TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.remote_session_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.remote_session_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_id UUID,
  agent_id UUID,
  provider_id UUID,
  session_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  recording_url TEXT,
  notes TEXT,
  technician_id UUID
);

-- =============================================
-- MICROSOFT 365 / AZURE AD INTEGRATION
-- =============================================

CREATE TABLE IF NOT EXISTS public.azure_ad_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret_encrypted TEXT,
  redirect_uri TEXT,
  scopes TEXT[] DEFAULT ARRAY['User.Read', 'Directory.Read.All'],
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_users BOOLEAN DEFAULT true,
  sync_groups BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.azure_ad_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  azure_object_id TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  job_title TEXT,
  department TEXT,
  office_location TEXT,
  phone TEXT,
  groups JSONB DEFAULT '[]',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teams_notification_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  notification_types TEXT[] DEFAULT ARRAY['ticket_created', 'ticket_escalated', 'sla_breach'],
  is_active BOOLEAN DEFAULT true,
  channel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ADVANCED REPORTING TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.helpdesk_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  chart_config JSONB DEFAULT '{}',
  schedule_config JSONB,
  is_scheduled BOOLEAN DEFAULT false,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_id UUID,
  snapshot_data JSONB NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE RLS ON ALL NEW TABLES
-- =============================================

ALTER TABLE public.customer_portal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_session_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azure_ad_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azure_ad_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

CREATE POLICY "Users manage own portal config" ON public.customer_portal_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own portal users" ON public.portal_users FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ticket assets" ON public.ticket_assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own remote providers" ON public.remote_session_providers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own remote history" ON public.remote_session_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own azure config" ON public.azure_ad_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own azure users" ON public.azure_ad_users FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own teams config" ON public.teams_notification_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own reports" ON public.helpdesk_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own snapshots" ON public.report_snapshots FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_portal_users_client ON public.portal_users(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON public.portal_users(email);
CREATE INDEX IF NOT EXISTS idx_ticket_assets_ticket ON public.ticket_assets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assets_asset ON public.ticket_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_remote_history_ticket ON public.remote_session_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_azure_users_object ON public.azure_ad_users(azure_object_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.helpdesk_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_report ON public.report_snapshots(report_id);