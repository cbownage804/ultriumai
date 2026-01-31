-- Per-Organization SLA Policies
CREATE TABLE public.vanguard_org_sla_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  -- Response time targets (in minutes)
  p1_response_minutes INTEGER DEFAULT 15,
  p2_response_minutes INTEGER DEFAULT 60,
  p3_response_minutes INTEGER DEFAULT 240,
  p4_response_minutes INTEGER DEFAULT 480,
  -- Resolution time targets (in hours)
  p1_resolution_hours INTEGER DEFAULT 4,
  p2_resolution_hours INTEGER DEFAULT 8,
  p3_resolution_hours INTEGER DEFAULT 24,
  p4_resolution_hours INTEGER DEFAULT 72,
  -- Business hours
  business_hours_only BOOLEAN DEFAULT true,
  business_start_hour INTEGER DEFAULT 9,
  business_end_hour INTEGER DEFAULT 17,
  business_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  timezone TEXT DEFAULT 'America/New_York',
  -- Escalation thresholds
  auto_escalate_at_percent INTEGER DEFAULT 75,
  notify_manager_at_percent INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar Integration Configurations
CREATE TABLE public.vanguard_calendar_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'google')),
  calendar_name TEXT NOT NULL,
  -- OAuth tokens (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('to_calendar', 'from_calendar', 'bidirectional')),
  sync_on_call BOOLEAN DEFAULT true,
  sync_appointments BOOLEAN DEFAULT true,
  sync_ticket_deadlines BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar Events (synced from/to external calendars)
CREATE TABLE public.vanguard_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  calendar_config_id UUID REFERENCES public.vanguard_calendar_configs(id) ON DELETE CASCADE,
  external_event_id TEXT,
  event_type TEXT CHECK (event_type IN ('on_call', 'appointment', 'maintenance', 'meeting', 'deadline')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  related_ticket_id UUID,
  related_client_id UUID,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'local_only')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Escalation Tracking for Analytics
CREATE TABLE public.vanguard_escalation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_id UUID REFERENCES public.vanguard_service_tickets(id) ON DELETE CASCADE,
  escalated_from_tier INTEGER NOT NULL,
  escalated_to_tier INTEGER NOT NULL,
  escalated_from_user UUID,
  escalated_to_user UUID,
  escalation_reason TEXT,
  escalation_type TEXT CHECK (escalation_type IN ('manual', 'auto_sla', 'auto_skill', 'customer_request')),
  time_in_previous_tier_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- White-Label Report Templates
CREATE TABLE public.vanguard_report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('performance', 'sla', 'ticket_summary', 'escalation', 'csat', 'custom')),
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  secondary_color TEXT DEFAULT '#8b5cf6',
  company_name TEXT,
  footer_text TEXT,
  -- Content sections
  include_sections JSONB DEFAULT '["summary", "metrics", "charts", "details"]',
  custom_css TEXT,
  -- Schedule
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  schedule_day INTEGER,
  recipients JSONB DEFAULT '[]',
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated Reports History
CREATE TABLE public.vanguard_generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.vanguard_report_templates(id) ON DELETE SET NULL,
  organization_id UUID,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB,
  pdf_url TEXT,
  generated_by UUID,
  sent_to JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vanguard_org_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_calendar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_generated_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their SLA policies" ON public.vanguard_org_sla_policies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their calendar configs" ON public.vanguard_calendar_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their calendar events" ON public.vanguard_calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their escalation events" ON public.vanguard_escalation_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their report templates" ON public.vanguard_report_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their generated reports" ON public.vanguard_generated_reports FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_org_sla_org ON public.vanguard_org_sla_policies(organization_id);
CREATE INDEX idx_calendar_events_time ON public.vanguard_calendar_events(start_time, end_time);
CREATE INDEX idx_escalation_ticket ON public.vanguard_escalation_events(ticket_id);
CREATE INDEX idx_generated_reports_period ON public.vanguard_generated_reports(period_start, period_end);