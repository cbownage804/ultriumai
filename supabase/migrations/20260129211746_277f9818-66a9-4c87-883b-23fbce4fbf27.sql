-- =====================================================
-- VANGUARD SENTINEL: M365 Security Monitoring
-- =====================================================

-- 1. M365 Tenant Connections (Per-Client OAuth)
CREATE TABLE public.vanguard_m365_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    tenant_domain TEXT,
    -- OAuth tokens (encrypted in practice)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    -- Permissions granted
    permissions_granted TEXT[] DEFAULT '{}',
    -- Monitoring settings
    monitor_risky_signins BOOLEAN DEFAULT true,
    monitor_conditional_access BOOLEAN DEFAULT true,
    monitor_mfa_status BOOLEAN DEFAULT true,
    monitor_mailbox_rules BOOLEAN DEFAULT true,
    -- Sync status
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending',
    sync_error TEXT,
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_m365_tenants_unique ON public.vanguard_m365_tenants(user_id, tenant_id);
CREATE INDEX idx_m365_tenants_client ON public.vanguard_m365_tenants(client_id);

-- 2. M365 Security Events (Raw events from Graph API)
CREATE TABLE public.vanguard_m365_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES public.vanguard_m365_tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
    -- Event identification
    event_type TEXT NOT NULL, -- risky_signin, conditional_access, mfa_failure, mailbox_rule
    event_id TEXT, -- Microsoft's event ID for deduplication
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    risk_level TEXT, -- Microsoft's risk level
    risk_state TEXT, -- atRisk, confirmedCompromised, remediated, etc.
    -- Affected user
    affected_user_email TEXT,
    affected_user_name TEXT,
    affected_user_id TEXT,
    -- Location/Device info
    ip_address TEXT,
    location_city TEXT,
    location_country TEXT,
    device_info JSONB DEFAULT '{}',
    -- Additional context
    event_details JSONB DEFAULT '{}',
    -- Timestamps
    event_timestamp TIMESTAMPTZ NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT now(),
    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    ai_analysis_id UUID,
    ticket_id UUID,
    -- Status
    status TEXT DEFAULT 'new', -- new, investigating, resolved, dismissed
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_m365_events_tenant ON public.vanguard_m365_security_events(tenant_id);
CREATE INDEX idx_m365_events_type ON public.vanguard_m365_security_events(event_type);
CREATE INDEX idx_m365_events_severity ON public.vanguard_m365_security_events(severity);
CREATE INDEX idx_m365_events_status ON public.vanguard_m365_security_events(status);
CREATE INDEX idx_m365_events_timestamp ON public.vanguard_m365_security_events(event_timestamp DESC);
CREATE UNIQUE INDEX idx_m365_events_dedup ON public.vanguard_m365_security_events(tenant_id, event_type, event_id) WHERE event_id IS NOT NULL;

-- 3. Cortex AI Security Analysis
CREATE TABLE public.vanguard_sentinel_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_id UUID REFERENCES public.vanguard_m365_security_events(id) ON DELETE CASCADE,
    -- AI Analysis results
    risk_score INTEGER DEFAULT 0, -- 0-100
    confidence_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    threat_category TEXT, -- credential_theft, impossible_travel, brute_force, etc.
    attack_vector TEXT,
    -- AI recommendations
    recommended_action TEXT, -- auto_remediate, create_ticket, investigate, dismiss
    remediation_steps TEXT[],
    related_events UUID[],
    -- Pattern matching
    is_pattern_match BOOLEAN DEFAULT false,
    pattern_id UUID,
    pattern_name TEXT,
    -- Decision tracking
    ai_decision TEXT, -- escalate, monitor, dismiss
    ai_reasoning TEXT,
    human_override BOOLEAN DEFAULT false,
    human_decision TEXT,
    human_notes TEXT,
    -- Ticket creation
    auto_ticket_created BOOLEAN DEFAULT false,
    ticket_id UUID,
    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER
);

CREATE INDEX idx_sentinel_ai_event ON public.vanguard_sentinel_ai_analysis(event_id);
CREATE INDEX idx_sentinel_ai_decision ON public.vanguard_sentinel_ai_analysis(ai_decision);
CREATE INDEX idx_sentinel_ai_risk ON public.vanguard_sentinel_ai_analysis(risk_score DESC);

-- 4. Sentinel Alert Rules (Custom thresholds)
CREATE TABLE public.vanguard_sentinel_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    description TEXT,
    -- Trigger conditions
    event_types TEXT[] DEFAULT '{}',
    severity_threshold TEXT DEFAULT 'medium',
    risk_score_threshold INTEGER DEFAULT 50,
    -- Actions
    auto_create_ticket BOOLEAN DEFAULT false,
    notify_email BOOLEAN DEFAULT true,
    notify_slack BOOLEAN DEFAULT false,
    block_user BOOLEAN DEFAULT false,
    require_mfa_reset BOOLEAN DEFAULT false,
    -- AI settings
    use_ai_triage BOOLEAN DEFAULT true,
    ai_auto_dismiss_below INTEGER DEFAULT 30, -- Auto-dismiss if AI score below this
    -- Status
    is_active BOOLEAN DEFAULT true,
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sentinel_rules_user ON public.vanguard_sentinel_rules(user_id);

-- 5. MFA Status Tracking (per-user snapshot)
CREATE TABLE public.vanguard_m365_mfa_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID REFERENCES public.vanguard_m365_tenants(id) ON DELETE CASCADE,
    -- User info
    m365_user_id TEXT NOT NULL,
    user_principal_name TEXT NOT NULL,
    display_name TEXT,
    -- MFA status
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_methods TEXT[] DEFAULT '{}', -- phone, authenticator, fido2, etc.
    default_mfa_method TEXT,
    -- Risk indicators
    is_admin BOOLEAN DEFAULT false,
    admin_roles TEXT[] DEFAULT '{}',
    last_sign_in_at TIMESTAMPTZ,
    days_since_last_signin INTEGER,
    -- Tracking
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_status_tenant ON public.vanguard_m365_mfa_status(tenant_id);
CREATE UNIQUE INDEX idx_mfa_status_unique ON public.vanguard_m365_mfa_status(tenant_id, m365_user_id, snapshot_date);

-- Enable RLS
ALTER TABLE public.vanguard_m365_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_m365_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_sentinel_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_sentinel_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_m365_mfa_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own M365 tenants" ON public.vanguard_m365_tenants
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own security events" ON public.vanguard_m365_security_events
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own AI analysis" ON public.vanguard_sentinel_ai_analysis
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sentinel rules" ON public.vanguard_sentinel_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own MFA status" ON public.vanguard_m365_mfa_status
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_m365_tenants_updated_at
    BEFORE UPDATE ON public.vanguard_m365_tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();

CREATE TRIGGER update_sentinel_rules_updated_at
    BEFORE UPDATE ON public.vanguard_sentinel_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();