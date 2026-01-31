-- Internal IT Technician accounts for co-managed clients
-- These are the client's own IT staff, not MSP technicians

CREATE TABLE public.comanaged_internal_technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- MSP owner who manages this
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  -- Auth
  auth_user_id UUID, -- Links to auth.users if they have portal login
  email TEXT NOT NULL,
  password_hash TEXT, -- For standalone portal auth (if not using Supabase Auth)
  -- Profile
  full_name TEXT NOT NULL,
  job_title TEXT,
  phone TEXT,
  avatar_url TEXT,
  -- Role & Permissions
  role TEXT DEFAULT 'technician', -- admin, technician, viewer
  can_create_tickets BOOLEAN DEFAULT true,
  can_close_tickets BOOLEAN DEFAULT true,
  can_assign_tickets BOOLEAN DEFAULT true,
  can_escalate_to_msp BOOLEAN DEFAULT true,
  can_view_all_tickets BOOLEAN DEFAULT true, -- vs only assigned
  can_manage_users BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_access_knowledge_base BOOLEAN DEFAULT true,
  can_manage_knowledge_base BOOLEAN DEFAULT false,
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  invite_sent_at TIMESTAMPTZ,
  invite_accepted_at TIMESTAMPTZ,
  -- Preferences
  notification_preferences JSONB DEFAULT '{"email_new_ticket": true, "email_assigned": true, "email_escalation": true}',
  signature TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Internal IT departments/teams
CREATE TABLE public.comanaged_internal_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  team_name TEXT NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES public.comanaged_internal_technicians(id) ON DELETE SET NULL,
  auto_assign_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team membership
CREATE TABLE public.comanaged_internal_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.comanaged_internal_teams(id) ON DELETE CASCADE NOT NULL,
  technician_id UUID REFERENCES public.comanaged_internal_technicians(id) ON DELETE CASCADE NOT NULL,
  is_lead BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, technician_id)
);

-- Track which tickets are assigned to internal IT vs escalated to MSP
ALTER TABLE public.comanaged_ticket_context 
  ADD COLUMN IF NOT EXISTS assigned_internal_tech_id UUID REFERENCES public.comanaged_internal_technicians(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_internal_team_id UUID REFERENCES public.comanaged_internal_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS handled_by TEXT DEFAULT 'internal_it', -- 'internal_it', 'msp', 'both'
  ADD COLUMN IF NOT EXISTS internal_priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS internal_status TEXT DEFAULT 'open';

-- Internal IT activity log (what they can see, separate from MSP logs)
CREATE TABLE public.comanaged_internal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID NOT NULL,
  technician_id UUID REFERENCES public.comanaged_internal_technicians(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'created', 'assigned', 'commented', 'status_change', 'escalated', 'resolved'
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Internal IT escalation requests to MSP
CREATE TABLE public.comanaged_escalation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID NOT NULL,
  requested_by_id UUID REFERENCES public.comanaged_internal_technicians(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  -- Escalation details
  escalation_reason TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- urgent, high, normal
  additional_notes TEXT,
  -- MSP response
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
  responded_by_msp_tech TEXT,
  response_notes TEXT,
  responded_at TIMESTAMPTZ,
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comanaged_internal_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_internal_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_internal_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_internal_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_escalation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies (MSP can manage all, internal techs see own org only)
CREATE POLICY "MSP manages internal technicians" ON public.comanaged_internal_technicians
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "MSP manages internal teams" ON public.comanaged_internal_teams
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "MSP manages team members" ON public.comanaged_internal_team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM public.comanaged_internal_teams WHERE organization_id IN (
        SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "MSP views activity log" ON public.comanaged_internal_activity_log
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "MSP manages escalations" ON public.comanaged_escalation_requests
  FOR ALL USING (
    organization_id IN (SELECT id FROM public.comanaged_organizations WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_internal_techs_org ON public.comanaged_internal_technicians(organization_id);
CREATE INDEX idx_internal_techs_email ON public.comanaged_internal_technicians(email);
CREATE INDEX idx_internal_activity_ticket ON public.comanaged_internal_activity_log(ticket_id);
CREATE INDEX idx_escalation_status ON public.comanaged_escalation_requests(status);