-- Notification Channels (Slack, SMS, PagerDuty, etc.)
CREATE TABLE public.vanguard_notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_type TEXT NOT NULL, -- email, slack, sms, pagerduty, opsgenie, teams, webhook
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alert Rules with conditions
CREATE TABLE public.vanguard_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]',
  severity_filter TEXT[] DEFAULT ARRAY['critical', 'high'],
  channel_ids UUID[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 5,
  correlation_window_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Escalation policies
CREATE TABLE public.vanguard_alert_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.vanguard_alert_rules(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  delay_minutes INTEGER NOT NULL DEFAULT 15,
  channel_id UUID REFERENCES public.vanguard_notification_channels(id) ON DELETE CASCADE,
  notify_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alert history for tracking
CREATE TABLE public.vanguard_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.vanguard_alert_rules(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.vanguard_notification_channels(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'medium',
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'sent', -- sent, delivered, failed, acknowledged
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- On-call schedules
CREATE TABLE public.vanguard_on_call_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  rotations JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Analytics metrics
CREATE TABLE public.vanguard_agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- cpu, memory, disk, response_time, command_count
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled Reports
CREATE TABLE public.vanguard_scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- executive, compliance, threat, performance
  schedule_cron TEXT NOT NULL DEFAULT '0 8 * * 1',
  format TEXT DEFAULT 'pdf', -- pdf, csv, html
  recipients TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Report generation history
CREATE TABLE public.vanguard_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.vanguard_scheduled_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, generating, completed, failed
  file_url TEXT,
  file_size_bytes INTEGER,
  generation_time_ms INTEGER,
  error_message TEXT,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vanguard_notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_alert_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_on_call_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own notification channels" ON public.vanguard_notification_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own alert rules" ON public.vanguard_alert_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage escalations for own rules" ON public.vanguard_alert_escalations FOR ALL USING (rule_id IN (SELECT id FROM public.vanguard_alert_rules WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own alert history" ON public.vanguard_alert_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own on-call schedules" ON public.vanguard_on_call_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own agent analytics" ON public.vanguard_agent_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own scheduled reports" ON public.vanguard_scheduled_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own report history" ON public.vanguard_report_history FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_notification_channels_user ON public.vanguard_notification_channels(user_id);
CREATE INDEX idx_alert_rules_user ON public.vanguard_alert_rules(user_id);
CREATE INDEX idx_alert_history_user_sent ON public.vanguard_alert_history(user_id, sent_at DESC);
CREATE INDEX idx_agent_analytics_agent_type ON public.vanguard_agent_analytics(agent_id, metric_type, recorded_at DESC);
CREATE INDEX idx_scheduled_reports_next_run ON public.vanguard_scheduled_reports(next_run_at) WHERE is_enabled = true;
CREATE INDEX idx_report_history_report ON public.vanguard_report_history(report_id, generated_at DESC);