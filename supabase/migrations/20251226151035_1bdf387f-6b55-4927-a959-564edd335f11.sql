-- Vanguard Agent Mesh Coordination
CREATE TABLE IF NOT EXISTS public.vanguard_mesh_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    discovered_agents JSONB DEFAULT '[]'::jsonb,
    mesh_role TEXT DEFAULT 'member', -- leader, member, failover
    mesh_status TEXT DEFAULT 'active',
    last_mesh_sync TIMESTAMPTZ DEFAULT now(),
    failover_priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Threat Intelligence Sharing
CREATE TABLE IF NOT EXISTS public.vanguard_mesh_intel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    intel_type TEXT NOT NULL, -- ioc, threat, vulnerability, behavior
    indicator_type TEXT, -- ip, domain, hash, url, pattern
    indicator_value TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    confidence_score INTEGER DEFAULT 50,
    context JSONB DEFAULT '{}'::jsonb,
    first_seen TIMESTAMPTZ DEFAULT now(),
    last_seen TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    shared_with_agents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Honeypot Events & Deception
CREATE TABLE IF NOT EXISTS public.vanguard_honeypot_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    honeypot_type TEXT NOT NULL, -- ssh, http, smb, ftp, rdp, telnet, decoy_file, decoy_creds
    honeypot_port INTEGER,
    attacker_ip TEXT,
    attacker_port INTEGER,
    interaction_type TEXT, -- connection, auth_attempt, command, file_access
    interaction_data JSONB DEFAULT '{}'::jsonb,
    username_attempted TEXT,
    password_attempted TEXT,
    commands_executed JSONB DEFAULT '[]'::jsonb,
    severity TEXT DEFAULT 'high',
    geo_location JSONB,
    threat_intel_match BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Security Baselines & Posture
CREATE TABLE IF NOT EXISTS public.vanguard_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    baseline_name TEXT NOT NULL,
    baseline_type TEXT NOT NULL, -- system, network, process, files, config
    baseline_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    checksum TEXT,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Baseline Drift Detection
CREATE TABLE IF NOT EXISTS public.vanguard_baseline_drifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID REFERENCES public.vanguard_baselines(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    drift_type TEXT NOT NULL, -- addition, removal, modification
    drift_category TEXT, -- file, process, port, service, config
    drift_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT DEFAULT 'medium',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT now()
);

-- Network Traffic Analysis
CREATE TABLE IF NOT EXISTS public.vanguard_traffic_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    capture_name TEXT NOT NULL,
    bpf_filter TEXT,
    interface TEXT,
    packet_count INTEGER DEFAULT 0,
    bytes_captured BIGINT DEFAULT 0,
    duration_seconds INTEGER,
    suspicious_flows JSONB DEFAULT '[]'::jsonb,
    exfiltration_detected BOOLEAN DEFAULT false,
    dns_tunneling_detected BOOLEAN DEFAULT false,
    c2_indicators JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running'
);

-- Integration Connector Logs
CREATE TABLE IF NOT EXISTS public.vanguard_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    integration_type TEXT NOT NULL, -- siem, ticketing, webhook, syslog
    integration_target TEXT, -- splunk, sentinel, servicenow, jira, custom
    event_type TEXT,
    event_data JSONB DEFAULT '{}'::jsonb,
    response_status INTEGER,
    response_data JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.vanguard_mesh_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_mesh_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_honeypot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_baseline_drifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_traffic_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mesh_agents
CREATE POLICY "Users can view their mesh agents" ON public.vanguard_mesh_agents
    FOR SELECT USING (
        agent_id IN (SELECT id FROM public.vanguard_agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage their mesh agents" ON public.vanguard_mesh_agents
    FOR ALL USING (
        agent_id IN (SELECT id FROM public.vanguard_agents WHERE user_id = auth.uid())
    );

-- RLS Policies for mesh_intel
CREATE POLICY "Users can view their intel" ON public.vanguard_mesh_intel
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their intel" ON public.vanguard_mesh_intel
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for honeypot_events
CREATE POLICY "Users can view their honeypot events" ON public.vanguard_honeypot_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their honeypot events" ON public.vanguard_honeypot_events
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for baselines
CREATE POLICY "Users can view their baselines" ON public.vanguard_baselines
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their baselines" ON public.vanguard_baselines
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for baseline_drifts
CREATE POLICY "Users can view their drifts" ON public.vanguard_baseline_drifts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their drifts" ON public.vanguard_baseline_drifts
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for traffic_captures
CREATE POLICY "Users can view their captures" ON public.vanguard_traffic_captures
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their captures" ON public.vanguard_traffic_captures
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for integration_logs
CREATE POLICY "Users can view their integration logs" ON public.vanguard_integration_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their integration logs" ON public.vanguard_integration_logs
    FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_mesh_agents_agent ON public.vanguard_mesh_agents(agent_id);
CREATE INDEX idx_mesh_intel_user ON public.vanguard_mesh_intel(user_id);
CREATE INDEX idx_mesh_intel_type ON public.vanguard_mesh_intel(intel_type);
CREATE INDEX idx_honeypot_events_agent ON public.vanguard_honeypot_events(agent_id);
CREATE INDEX idx_honeypot_events_user ON public.vanguard_honeypot_events(user_id);
CREATE INDEX idx_honeypot_events_attacker ON public.vanguard_honeypot_events(attacker_ip);
CREATE INDEX idx_baselines_agent ON public.vanguard_baselines(agent_id);
CREATE INDEX idx_baselines_user ON public.vanguard_baselines(user_id);
CREATE INDEX idx_baseline_drifts_agent ON public.vanguard_baseline_drifts(agent_id);
CREATE INDEX idx_traffic_captures_agent ON public.vanguard_traffic_captures(agent_id);
CREATE INDEX idx_integration_logs_user ON public.vanguard_integration_logs(user_id);