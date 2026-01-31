-- Co-Managed IT Support Architecture
-- Enables MSPs to provide white-labeled support where end-users only see their internal IT branding

-- Tenant hierarchy: MSP (owner) → Co-Managed Organization → Departments → End Users
CREATE TABLE public.comanaged_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- MSP owner
  organization_name TEXT NOT NULL,
  internal_it_name TEXT NOT NULL, -- What end-users see (e.g., "Acme IT Department")
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Complete branding override for each co-managed client
CREATE TABLE public.comanaged_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  -- Visual Identity
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#0066cc',
  secondary_color TEXT DEFAULT '#004499',
  accent_color TEXT DEFAULT '#00aaff',
  -- Portal Customization  
  portal_title TEXT, -- "Acme IT Support Portal"
  portal_welcome_message TEXT,
  portal_footer_text TEXT,
  custom_css TEXT,
  -- Email Masking
  support_email_display TEXT, -- "it@acmecorp.com" (what users see)
  support_email_reply_to TEXT, -- Actual reply-to address
  email_from_name TEXT, -- "Acme IT Support"
  email_signature_html TEXT,
  -- Contact Masking
  support_phone_display TEXT,
  support_hours_display TEXT,
  physical_address_display TEXT,
  -- Domain (optional)
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Departments within co-managed orgs (for routing)
CREATE TABLE public.comanaged_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  department_name TEXT NOT NULL,
  department_head_email TEXT,
  ticket_routing_priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- End users within co-managed organizations
CREATE TABLE public.comanaged_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  department_id UUID REFERENCES public.comanaged_departments(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  is_vip BOOLEAN DEFAULT false,
  portal_access_enabled BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- MSP Technician visibility into co-managed accounts
CREATE TYPE public.tech_visibility_mode AS ENUM ('shadow', 'branded', 'hybrid');

CREATE TABLE public.comanaged_technician_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- MSP owner
  technician_id UUID NOT NULL, -- From helpdesk_technicians
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  -- Visibility settings
  visibility_mode tech_visibility_mode DEFAULT 'shadow',
  can_view_internal_notes BOOLEAN DEFAULT true,
  can_respond_as_internal BOOLEAN DEFAULT false, -- Appear as internal IT
  display_name_override TEXT, -- What end-users see if responding
  display_title_override TEXT,
  -- Permissions
  can_create_tickets BOOLEAN DEFAULT true,
  can_close_tickets BOOLEAN DEFAULT true,
  can_escalate BOOLEAN DEFAULT true,
  can_access_billing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(technician_id, organization_id)
);

-- Co-managed specific ticket fields
CREATE TABLE public.comanaged_ticket_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL, -- References vanguard_tickets
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  submitted_by_user_id UUID REFERENCES public.comanaged_users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.comanaged_departments(id) ON DELETE SET NULL,
  -- Source tracking
  source_channel TEXT DEFAULT 'portal', -- portal, email, phone, chat
  -- Internal IT visibility
  visible_to_internal_it BOOLEAN DEFAULT true,
  internal_it_notes TEXT, -- Notes only internal IT sees
  -- MSP visibility
  msp_private_notes TEXT, -- Notes only MSP techs see
  escalated_to_msp BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalated_by TEXT,
  escalation_reason TEXT,
  -- Response masking
  last_response_appeared_from TEXT, -- "John from Acme IT" not "John from MSP"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticket_id)
);

-- Communication log with source masking
CREATE TABLE public.comanaged_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  -- Actual sender
  actual_sender_type TEXT NOT NULL, -- 'msp_tech', 'internal_it', 'end_user'
  actual_sender_id TEXT,
  actual_sender_name TEXT,
  -- Displayed sender (what end-user sees)
  displayed_sender_name TEXT NOT NULL,
  displayed_sender_title TEXT,
  displayed_sender_avatar TEXT,
  -- Message content
  message_content TEXT NOT NULL,
  message_html TEXT,
  is_internal_note BOOLEAN DEFAULT false, -- Hidden from end-user
  is_msp_private BOOLEAN DEFAULT false, -- Hidden from internal IT too
  -- Channel
  channel TEXT DEFAULT 'portal', -- portal, email, phone
  -- Attachments
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SLA overrides per co-managed organization
CREATE TABLE public.comanaged_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  policy_name TEXT NOT NULL,
  priority TEXT NOT NULL, -- critical, high, medium, low
  first_response_minutes INTEGER NOT NULL,
  resolution_minutes INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT true,
  escalation_path JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, priority)
);

-- Customer scheduling appointments
CREATE TABLE public.customer_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- MSP owner
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
  ticket_id UUID, -- Optional link to ticket
  customer_user_id UUID REFERENCES public.comanaged_users(id) ON DELETE SET NULL,
  -- Appointment details
  appointment_type TEXT NOT NULL, -- remote_support, onsite, phone, screenshare
  title TEXT NOT NULL,
  description TEXT,
  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  -- Technician assignment
  technician_id UUID,
  technician_name TEXT,
  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled, no_show
  -- Customer info (for non-portal bookings)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  -- Location (for onsite)
  location_address TEXT,
  location_notes TEXT,
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_24h_sent BOOLEAN DEFAULT false,
  -- Calendar sync
  outlook_event_id TEXT,
  google_event_id TEXT,
  ical_uid TEXT,
  -- Completion
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Technician availability for scheduling
CREATE TABLE public.technician_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  -- Regular schedule
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  -- Service types offered
  appointment_types TEXT[] DEFAULT ARRAY['remote_support', 'phone'],
  -- Buffer time between appointments
  buffer_minutes INTEGER DEFAULT 15,
  -- Max appointments per day
  max_daily_appointments INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(technician_id, day_of_week)
);

-- Technician time-off / blocked times
CREATE TABLE public.technician_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  blocked_start TIMESTAMPTZ NOT NULL,
  blocked_end TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.comanaged_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_technician_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_ticket_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_blocked_times ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own comanaged orgs" ON public.comanaged_organizations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own org branding" ON public.comanaged_branding
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own org departments" ON public.comanaged_departments
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own org users" ON public.comanaged_users
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage tech access" ON public.comanaged_technician_access
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage ticket context" ON public.comanaged_ticket_context
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage communications" ON public.comanaged_communications
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage SLA policies" ON public.comanaged_sla_policies
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage appointments" ON public.customer_appointments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage availability" ON public.technician_availability
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage blocked times" ON public.technician_blocked_times
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_comanaged_users_org ON public.comanaged_users(organization_id);
CREATE INDEX idx_comanaged_users_email ON public.comanaged_users(email);
CREATE INDEX idx_comanaged_ticket_context_ticket ON public.comanaged_ticket_context(ticket_id);
CREATE INDEX idx_comanaged_communications_ticket ON public.comanaged_communications(ticket_id);
CREATE INDEX idx_customer_appointments_scheduled ON public.customer_appointments(scheduled_start);
CREATE INDEX idx_customer_appointments_technician ON public.customer_appointments(technician_id);