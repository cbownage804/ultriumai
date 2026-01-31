-- =====================================================
-- CO-MANAGED COLLABORATION FEATURES
-- =====================================================

-- Internal/MSP Chat channels
CREATE TABLE IF NOT EXISTS public.comanaged_chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
    channel_name TEXT NOT NULL,
    channel_type TEXT DEFAULT 'general' CHECK (channel_type IN ('general', 'escalation', 'announcement', 'ticket')),
    ticket_id UUID,
    is_private BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages with visibility control
CREATE TABLE IF NOT EXISTS public.comanaged_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.comanaged_chat_channels(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('msp_tech', 'internal_tech', 'system')),
    message_content TEXT NOT NULL,
    visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'msp_only', 'internal_only')),
    is_pinned BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    read_by JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    edited_at TIMESTAMPTZ
);

-- Ticket visibility layers (private vs shared notes)
CREATE TABLE IF NOT EXISTS public.comanaged_ticket_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('msp_tech', 'internal_tech', 'customer')),
    note_content TEXT NOT NULL,
    visibility TEXT DEFAULT 'shared' CHECK (visibility IN ('shared', 'msp_only', 'internal_only', 'customer_visible')),
    note_type TEXT DEFAULT 'note' CHECK (note_type IN ('note', 'resolution', 'escalation', 'handoff', 'system')),
    mentioned_users JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client announcements
CREATE TABLE IF NOT EXISTS public.comanaged_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'maintenance', 'outage', 'update', 'urgent')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'internal_it', 'end_users', 'msp_only')),
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Announcement read tracking
CREATE TABLE IF NOT EXISTS public.comanaged_announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.comanaged_announcements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(announcement_id, user_id)
);

-- Real-time co-editing presence
CREATE TABLE IF NOT EXISTS public.comanaged_editing_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('ticket', 'document', 'runbook')),
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT,
    cursor_position JSONB,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(resource_type, resource_id, user_id)
);

-- =====================================================
-- CALENDAR & SCHEDULING
-- =====================================================

-- Calendar integrations per user
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('outlook', 'google')),
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id TEXT,
    sync_enabled BOOLEAN DEFAULT true,
    sync_appointments BOOLEAN DEFAULT true,
    sync_tasks BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- On-call rotation schedules
CREATE TABLE IF NOT EXISTS public.comanaged_oncall_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
    schedule_name TEXT NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    rotation_type TEXT DEFAULT 'weekly' CHECK (rotation_type IN ('daily', 'weekly', 'custom')),
    escalation_timeout_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- On-call rotation members
CREATE TABLE IF NOT EXISTS public.comanaged_oncall_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.comanaged_oncall_schedules(id) ON DELETE CASCADE NOT NULL,
    technician_id UUID NOT NULL,
    technician_type TEXT NOT NULL CHECK (technician_type IN ('msp', 'internal')),
    rotation_order INTEGER NOT NULL,
    notification_methods JSONB DEFAULT '["email", "sms"]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- On-call overrides (vacation, swap)
CREATE TABLE IF NOT EXISTS public.comanaged_oncall_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.comanaged_oncall_schedules(id) ON DELETE CASCADE NOT NULL,
    original_member_id UUID REFERENCES public.comanaged_oncall_members(id),
    substitute_member_id UUID REFERENCES public.comanaged_oncall_members(id),
    override_start TIMESTAMPTZ NOT NULL,
    override_end TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- AUTOMATION & WORKFLOW
-- =====================================================

-- Auto-escalation rules
CREATE TABLE IF NOT EXISTS public.comanaged_escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time_based', 'priority_based', 'category_based', 'skill_mismatch')),
    conditions JSONB NOT NULL DEFAULT '{}',
    escalate_after_minutes INTEGER DEFAULT 60,
    escalate_to TEXT DEFAULT 'msp' CHECK (escalate_to IN ('msp', 'internal_manager', 'oncall')),
    notify_parties JSONB DEFAULT '["requester", "assignee"]',
    priority_bump BOOLEAN DEFAULT false,
    auto_assign_to UUID,
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skill-based routing configuration
CREATE TABLE IF NOT EXISTS public.comanaged_skill_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_category TEXT,
    required_certifications JSONB DEFAULT '[]',
    priority_weight INTEGER DEFAULT 1,
    fallback_to_msp BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Technician skills mapping
CREATE TABLE IF NOT EXISTS public.comanaged_technician_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL,
    technician_type TEXT NOT NULL CHECK (technician_type IN ('msp', 'internal')),
    skill_id UUID REFERENCES public.comanaged_skill_routing(id) ON DELETE CASCADE NOT NULL,
    proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
    certified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(technician_id, skill_id)
);

-- Shift handoff protocols
CREATE TABLE IF NOT EXISTS public.comanaged_shift_handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE,
    outgoing_tech_id UUID NOT NULL,
    incoming_tech_id UUID NOT NULL,
    handoff_time TIMESTAMPTZ DEFAULT now(),
    summary TEXT NOT NULL,
    open_tickets JSONB DEFAULT '[]',
    priority_items JSONB DEFAULT '[]',
    pending_escalations JSONB DEFAULT '[]',
    notes TEXT,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- REPORTING ADDITIONS
-- =====================================================

-- Internal IT performance metrics (aggregated)
CREATE TABLE IF NOT EXISTS public.comanaged_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
    technician_id UUID NOT NULL,
    technician_type TEXT NOT NULL CHECK (technician_type IN ('msp', 'internal')),
    metric_date DATE NOT NULL,
    tickets_resolved INTEGER DEFAULT 0,
    avg_resolution_minutes NUMERIC,
    first_response_met INTEGER DEFAULT 0,
    first_response_missed INTEGER DEFAULT 0,
    escalations_created INTEGER DEFAULT 0,
    escalations_received INTEGER DEFAULT 0,
    csat_score NUMERIC,
    csat_responses INTEGER DEFAULT 0,
    billable_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, technician_id, metric_date)
);

-- Enable RLS on all tables
ALTER TABLE public.comanaged_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_editing_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_oncall_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_oncall_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_oncall_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_skill_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_technician_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_shift_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can access chat channels" ON public.comanaged_chat_channels FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access chat messages" ON public.comanaged_chat_messages FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access ticket notes" ON public.comanaged_ticket_notes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access announcements" ON public.comanaged_announcements FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can track reads" ON public.comanaged_announcement_reads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can track presence" ON public.comanaged_editing_presence FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can access their calendar integrations" ON public.calendar_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can access oncall schedules" ON public.comanaged_oncall_schedules FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access oncall members" ON public.comanaged_oncall_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access oncall overrides" ON public.comanaged_oncall_overrides FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access escalation rules" ON public.comanaged_escalation_rules FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access skill routing" ON public.comanaged_skill_routing FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access technician skills" ON public.comanaged_technician_skills FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access shift handoffs" ON public.comanaged_shift_handoffs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can access performance metrics" ON public.comanaged_performance_metrics FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.comanaged_chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket ON public.comanaged_ticket_notes(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_org ON public.comanaged_announcements(organization_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_org ON public.comanaged_escalation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON public.comanaged_performance_metrics(organization_id, metric_date DESC);