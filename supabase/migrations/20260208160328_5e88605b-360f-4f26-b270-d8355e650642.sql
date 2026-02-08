
-- Announcements table for admin-to-user messaging
CREATE TABLE public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all','admins','msp_users','clients')),
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements" ON public.admin_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read active announcements" ON public.admin_announcements FOR SELECT TO authenticated
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));

-- Error tracking table
CREATE TABLE public.platform_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  page_url TEXT,
  browser_info TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.platform_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage errors" ON public.platform_error_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own errors" ON public.platform_error_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User activity feed
CREATE TABLE public.user_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read activity" ON public.user_activity_feed FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin alert rules config
CREATE TABLE public.admin_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('error_spike','ticket_spike','service_degradation','user_anomaly','security_event')),
  conditions JSONB NOT NULL DEFAULT '{}',
  notification_channels JSONB NOT NULL DEFAULT '["dashboard"]',
  is_enabled BOOLEAN DEFAULT true,
  threshold_value INTEGER DEFAULT 5,
  time_window_minutes INTEGER DEFAULT 60,
  cooldown_minutes INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.admin_alert_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage alert configs" ON public.admin_alert_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Impersonation audit log
CREATE TABLE public.admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_email TEXT,
  reason TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  actions_taken JSONB DEFAULT '[]'
);
ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage impersonation logs" ON public.admin_impersonation_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
