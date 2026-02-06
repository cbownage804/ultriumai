-- =============================================
-- Google Workspace Tenants
-- =============================================
CREATE TABLE public.vanguard_gws_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  customer_id TEXT,
  service_account_email TEXT,
  admin_email TEXT,
  credentials_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  monitoring_config JSONB DEFAULT '{"login_monitoring": true, "admin_changes": true, "drive_monitoring": true, "gmail_monitoring": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_gws_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own GWS tenants" ON public.vanguard_gws_tenants
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Google Workspace Security Events
-- =============================================
CREATE TABLE public.vanguard_gws_security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.vanguard_gws_tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'login',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  description TEXT,
  affected_user_email TEXT,
  affected_user_name TEXT,
  ip_address TEXT,
  location_info JSONB,
  event_details JSONB DEFAULT '{}'::jsonb,
  raw_event_data JSONB DEFAULT '{}'::jsonb,
  ai_triage_status TEXT,
  ai_confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.vanguard_gws_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own GWS events" ON public.vanguard_gws_security_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gws_events_user_status ON public.vanguard_gws_security_events(user_id, status);
CREATE INDEX idx_gws_events_category ON public.vanguard_gws_security_events(event_category);
CREATE INDEX idx_gws_events_severity ON public.vanguard_gws_security_events(severity);
CREATE INDEX idx_gws_events_created ON public.vanguard_gws_security_events(created_at DESC);

-- =============================================
-- Enhanced M365 event types for full SaaS Alerts parity
-- =============================================
-- Add additional M365 monitoring categories
ALTER TABLE public.vanguard_m365_security_events
  ADD COLUMN IF NOT EXISTS event_category TEXT DEFAULT 'sign_in',
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- =============================================
-- Unified SaaS alert rules (platform-agnostic)
-- =============================================
CREATE TABLE public.vanguard_saas_alert_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'm365',
  event_categories TEXT[] DEFAULT '{}',
  severity_threshold TEXT DEFAULT 'medium',
  auto_ticket BOOLEAN DEFAULT false,
  auto_triage BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '{"email": true, "slack": false, "teams": false}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_saas_alert_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SaaS alert policies" ON public.vanguard_saas_alert_policies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_gws_tenants_updated_at BEFORE UPDATE ON public.vanguard_gws_tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saas_alert_policies_updated_at BEFORE UPDATE ON public.vanguard_saas_alert_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();