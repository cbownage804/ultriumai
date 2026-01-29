-- =====================================================
-- VANGUARD PLATFORM DATABASE INTEGRATION
-- Tables for: Compliance, SLA, Time Tracking, CSAT, Billing
-- =====================================================

-- 1. Endpoint Compliance History (for trend tracking)
CREATE TABLE public.vanguard_compliance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_score INTEGER DEFAULT 0,
    cis_score INTEGER DEFAULT 0,
    bitlocker_enabled BOOLEAN DEFAULT false,
    antivirus_enabled BOOLEAN DEFAULT false,
    antivirus_updated BOOLEAN DEFAULT false,
    firewall_enabled BOOLEAN DEFAULT false,
    windows_update_score INTEGER DEFAULT 0,
    pending_updates INTEGER DEFAULT 0,
    critical_updates_pending INTEGER DEFAULT 0,
    gpo_compliant BOOLEAN DEFAULT true,
    compliance_details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying by agent and date
CREATE INDEX idx_compliance_history_agent_date ON public.vanguard_compliance_history(agent_id, snapshot_date DESC);
CREATE INDEX idx_compliance_history_user ON public.vanguard_compliance_history(user_id);

-- 2. SLA Policies Table
CREATE TABLE public.vanguard_sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
    policy_name TEXT NOT NULL,
    priority_level TEXT NOT NULL DEFAULT 'medium',
    response_hours INTEGER NOT NULL DEFAULT 4,
    resolution_hours INTEGER NOT NULL DEFAULT 24,
    business_hours_only BOOLEAN DEFAULT true,
    business_hours_start TIME DEFAULT '09:00',
    business_hours_end TIME DEFAULT '17:00',
    business_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
    escalation_enabled BOOLEAN DEFAULT true,
    escalation_after_hours INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_policies_user ON public.vanguard_sla_policies(user_id);
CREATE INDEX idx_sla_policies_client ON public.vanguard_sla_policies(client_id);

-- 3. SLA Tracking per Ticket
CREATE TABLE public.vanguard_ticket_sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    sla_policy_id UUID REFERENCES public.vanguard_sla_policies(id) ON DELETE SET NULL,
    response_due_at TIMESTAMPTZ,
    resolution_due_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    response_breached BOOLEAN DEFAULT false,
    resolution_breached BOOLEAN DEFAULT false,
    escalated BOOLEAN DEFAULT false,
    escalated_at TIMESTAMPTZ,
    pause_reason TEXT,
    paused_at TIMESTAMPTZ,
    total_pause_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_tracking_ticket ON public.vanguard_ticket_sla_tracking(ticket_id);
CREATE INDEX idx_sla_tracking_due ON public.vanguard_ticket_sla_tracking(resolution_due_at);

-- 4. Time Entries for Billing
CREATE TABLE public.vanguard_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ticket_id UUID,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
    technician_id UUID,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    is_billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    billing_status TEXT DEFAULT 'unbilled',
    invoice_id UUID,
    work_type TEXT DEFAULT 'support',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_user ON public.vanguard_time_entries(user_id);
CREATE INDEX idx_time_entries_ticket ON public.vanguard_time_entries(ticket_id);
CREATE INDEX idx_time_entries_client ON public.vanguard_time_entries(client_id);
CREATE INDEX idx_time_entries_billing ON public.vanguard_time_entries(billing_status);

-- 5. CSAT Survey Responses
CREATE TABLE public.vanguard_csat_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ticket_id UUID,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
    contact_email TEXT,
    contact_name TEXT,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    technician_rating INTEGER CHECK (technician_rating >= 1 AND technician_rating <= 5),
    resolution_rating INTEGER CHECK (resolution_rating >= 1 AND resolution_rating <= 5),
    response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    feedback_text TEXT,
    would_recommend BOOLEAN,
    survey_sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ DEFAULT now(),
    technician_id UUID,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_csat_user ON public.vanguard_csat_responses(user_id);
CREATE INDEX idx_csat_ticket ON public.vanguard_csat_responses(ticket_id);
CREATE INDEX idx_csat_client ON public.vanguard_csat_responses(client_id);
CREATE INDEX idx_csat_nps ON public.vanguard_csat_responses(nps_score);

-- 6. Client Usage Snapshots (for MSP Billing)
CREATE TABLE public.vanguard_client_usage_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    device_count INTEGER DEFAULT 0,
    server_count INTEGER DEFAULT 0,
    workstation_count INTEGER DEFAULT 0,
    user_count INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10,2) DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    ticket_count INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    billable_hours DECIMAL(10,2) DEFAULT 0,
    features_used JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_snapshots_client ON public.vanguard_client_usage_snapshots(client_id, snapshot_date DESC);
CREATE INDEX idx_usage_snapshots_user ON public.vanguard_client_usage_snapshots(user_id);

-- 7. Email-to-Ticket Configuration
CREATE TABLE public.vanguard_email_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
    incoming_email TEXT NOT NULL,
    display_name TEXT,
    auto_create_tickets BOOLEAN DEFAULT true,
    default_priority TEXT DEFAULT 'medium',
    default_category TEXT,
    auto_reply_enabled BOOLEAN DEFAULT true,
    auto_reply_template TEXT,
    email_signature TEXT,
    forward_to_technician BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_configs_user ON public.vanguard_email_configs(user_id);
CREATE INDEX idx_email_configs_client ON public.vanguard_email_configs(client_id);

-- 8. Ticket Workflow States
CREATE TABLE public.vanguard_workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    workflow_name TEXT NOT NULL,
    description TEXT,
    states JSONB NOT NULL DEFAULT '[]',
    transitions JSONB NOT NULL DEFAULT '[]',
    triggers JSONB DEFAULT '[]',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_states_user ON public.vanguard_workflow_states(user_id);

-- 9. Rate Cards for Billing
CREATE TABLE public.vanguard_rate_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    work_type TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    minimum_hours DECIMAL(4,2) DEFAULT 0.25,
    after_hours_multiplier DECIMAL(3,2) DEFAULT 1.5,
    weekend_multiplier DECIMAL(3,2) DEFAULT 2.0,
    emergency_multiplier DECIMAL(3,2) DEFAULT 2.0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_cards_user ON public.vanguard_rate_cards(user_id);
CREATE INDEX idx_rate_cards_client ON public.vanguard_rate_cards(client_id);

-- Enable RLS on all tables
ALTER TABLE public.vanguard_compliance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_ticket_sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_csat_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_client_usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_rate_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user can manage their own data)
CREATE POLICY "Users can manage own compliance history" ON public.vanguard_compliance_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own SLA policies" ON public.vanguard_sla_policies
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own SLA tracking" ON public.vanguard_ticket_sla_tracking
    FOR ALL USING (true);

CREATE POLICY "Users can manage own time entries" ON public.vanguard_time_entries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own CSAT responses" ON public.vanguard_csat_responses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own usage snapshots" ON public.vanguard_client_usage_snapshots
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own email configs" ON public.vanguard_email_configs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workflow states" ON public.vanguard_workflow_states
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own rate cards" ON public.vanguard_rate_cards
    FOR ALL USING (auth.uid() = user_id);

-- Function to calculate time entry duration and amount
CREATE OR REPLACE FUNCTION public.calculate_time_entry_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
        IF NEW.hourly_rate IS NOT NULL THEN
            NEW.total_amount := (NEW.duration_minutes / 60.0) * NEW.hourly_rate;
        END IF;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_calculate_time_entry
    BEFORE INSERT OR UPDATE ON public.vanguard_time_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_time_entry_totals();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_vanguard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_sla_policies_updated_at
    BEFORE UPDATE ON public.vanguard_sla_policies
    FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();

CREATE TRIGGER update_email_configs_updated_at
    BEFORE UPDATE ON public.vanguard_email_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();

CREATE TRIGGER update_workflow_states_updated_at
    BEFORE UPDATE ON public.vanguard_workflow_states
    FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();

CREATE TRIGGER update_rate_cards_updated_at
    BEFORE UPDATE ON public.vanguard_rate_cards
    FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();