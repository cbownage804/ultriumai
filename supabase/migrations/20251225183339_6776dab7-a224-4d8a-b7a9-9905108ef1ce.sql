-- =====================================================
-- VANGUARD ENTERPRISE SECURITY PLATFORM SCHEMA
-- Phase 1: Core SOC Foundation
-- =====================================================

-- Threat Intelligence Cache (VirusTotal, AbuseIPDB results)
CREATE TABLE public.threat_intel_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    indicator_type TEXT NOT NULL, -- 'ip', 'domain', 'hash', 'url'
    indicator_value TEXT NOT NULL,
    source TEXT NOT NULL, -- 'virustotal', 'abuseipdb', 'alienvault'
    reputation_score INTEGER,
    is_malicious BOOLEAN DEFAULT false,
    categories TEXT[],
    raw_response JSONB,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
    UNIQUE(indicator_type, indicator_value, source)
);

-- MITRE ATT&CK Mappings for findings
CREATE TABLE public.mitre_attack_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID,
    incident_id UUID REFERENCES public.security_incidents(id) ON DELETE CASCADE,
    tactic_id TEXT NOT NULL, -- e.g., 'TA0001'
    tactic_name TEXT NOT NULL, -- e.g., 'Initial Access'
    technique_id TEXT NOT NULL, -- e.g., 'T1566'
    technique_name TEXT NOT NULL, -- e.g., 'Phishing'
    sub_technique_id TEXT,
    sub_technique_name TEXT,
    confidence DECIMAL(5,2) DEFAULT 0.8,
    evidence JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- MDR Case Management
CREATE TABLE public.mdr_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    case_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'remediated', 'closed', 'false_positive')),
    priority INTEGER DEFAULT 3,
    assigned_analyst UUID,
    escalation_level INTEGER DEFAULT 0,
    incident_ids UUID[] DEFAULT '{}',
    affected_assets JSONB DEFAULT '[]',
    timeline JSONB DEFAULT '[]',
    notes TEXT,
    root_cause TEXT,
    remediation_steps TEXT[],
    lessons_learned TEXT,
    time_to_detect_minutes INTEGER,
    time_to_respond_minutes INTEGER,
    time_to_contain_minutes INTEGER,
    time_to_remediate_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    first_response_at TIMESTAMP WITH TIME ZONE,
    contained_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- MDR Case Activity Log
CREATE TABLE public.mdr_case_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.mdr_cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL, -- 'comment', 'status_change', 'assignment', 'escalation', 'action_taken', 'evidence_added'
    description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Live Response Sessions
CREATE TABLE public.live_response_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.mdr_cases(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL DEFAULT 'shell' CHECK (session_type IN ('shell', 'powershell', 'bash', 'file_browser', 'process_viewer', 'registry_viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated', 'error')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    session_notes TEXT,
    commands_executed INTEGER DEFAULT 0,
    recording_enabled BOOLEAN DEFAULT true
);

-- Live Response Command History
CREATE TABLE public.live_response_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.live_response_sessions(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    output TEXT,
    exit_code INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    duration_ms INTEGER,
    is_dangerous BOOLEAN DEFAULT false -- flagged for audit
);

-- Automated Containment Actions
CREATE TABLE public.containment_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
    case_id UUID REFERENCES public.mdr_cases(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('network_isolate', 'process_kill', 'file_quarantine', 'user_disable', 'service_stop', 'registry_block', 'firewall_block')),
    target_details JSONB NOT NULL, -- { process_id, file_path, user_id, ip_address, etc. }
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'rolled_back')),
    result JSONB,
    error_message TEXT,
    rollback_available BOOLEAN DEFAULT false,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID,
    approved_by UUID,
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- YARA Rules Engine
CREATE TABLE public.yara_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    rule_content TEXT NOT NULL,
    category TEXT, -- 'malware', 'ransomware', 'cryptominer', 'backdoor', 'custom'
    severity TEXT DEFAULT 'medium',
    is_enabled BOOLEAN DEFAULT true,
    author TEXT,
    description TEXT,
    tags TEXT[],
    match_count INTEGER DEFAULT 0,
    last_match_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- YARA Rule Matches
CREATE TABLE public.yara_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES public.yara_rules(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
    file_path TEXT,
    file_hash TEXT,
    matched_strings TEXT[],
    scan_type TEXT, -- 'scheduled', 'on_access', 'manual'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- File Integrity Monitoring
CREATE TABLE public.fim_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_size BIGINT,
    permissions TEXT,
    owner TEXT,
    last_modified TIMESTAMP WITH TIME ZONE,
    is_directory BOOLEAN DEFAULT false,
    is_monitored BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(agent_id, file_path)
);

-- FIM Change Events
CREATE TABLE public.fim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID REFERENCES public.fim_baselines(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'modified', 'deleted', 'permissions_changed', 'owner_changed', 'renamed')),
    old_hash TEXT,
    new_hash TEXT,
    old_value JSONB,
    new_value JSONB,
    severity TEXT DEFAULT 'medium',
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Process Tree / Timeline
CREATE TABLE public.process_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    process_id INTEGER NOT NULL,
    parent_process_id INTEGER,
    process_name TEXT NOT NULL,
    command_line TEXT,
    executable_path TEXT,
    file_hash TEXT,
    user_name TEXT,
    user_sid TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('started', 'terminated', 'network_connection', 'file_access', 'registry_access', 'injection')),
    network_connections JSONB DEFAULT '[]',
    loaded_modules JSONB DEFAULT '[]',
    is_suspicious BOOLEAN DEFAULT false,
    threat_indicators TEXT[],
    mitre_techniques TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Asset Risk Scoring
CREATE TABLE public.asset_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- 'endpoint', 'server', 'network_device', 'iot'
    asset_identifier TEXT NOT NULL,
    overall_risk_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    vulnerability_score DECIMAL(5,2) DEFAULT 0,
    exposure_score DECIMAL(5,2) DEFAULT 0,
    patch_score DECIMAL(5,2) DEFAULT 0,
    configuration_score DECIMAL(5,2) DEFAULT 0,
    behavioral_score DECIMAL(5,2) DEFAULT 0,
    risk_factors JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Integration Hub (webhooks & external services)
CREATE TABLE public.security_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    integration_type TEXT NOT NULL, -- 'slack', 'teams', 'pagerduty', 'jira', 'webhook', 'email', 'sms'
    name TEXT NOT NULL,
    configuration JSONB NOT NULL, -- encrypted webhook URLs, channels, etc.
    is_enabled BOOLEAN DEFAULT true,
    trigger_conditions JSONB DEFAULT '{}', -- severity levels, event types to trigger on
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.threat_intel_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitre_attack_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mdr_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mdr_case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_response_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_response_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containment_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yara_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yara_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fim_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user-scoped access
CREATE POLICY "Users can access their own threat intel" ON public.threat_intel_cache FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own MITRE mappings" ON public.mitre_attack_mappings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can access their own MDR cases" ON public.mdr_cases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access MDR activities for their cases" ON public.mdr_case_activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their live response sessions" ON public.live_response_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access commands for their sessions" ON public.live_response_commands FOR ALL USING (EXISTS (SELECT 1 FROM public.live_response_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can access their containment actions" ON public.containment_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their YARA rules" ON public.yara_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their YARA matches" ON public.yara_matches FOR ALL USING (EXISTS (SELECT 1 FROM public.yara_rules r WHERE r.id = rule_id AND r.user_id = auth.uid()));
CREATE POLICY "Users can access their FIM baselines" ON public.fim_baselines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their FIM events" ON public.fim_events FOR ALL USING (EXISTS (SELECT 1 FROM public.vanguard_agents a WHERE a.id = agent_id AND a.user_id = auth.uid()));
CREATE POLICY "Users can access their process events" ON public.process_events FOR ALL USING (EXISTS (SELECT 1 FROM public.vanguard_agents a WHERE a.id = agent_id AND a.user_id = auth.uid()));
CREATE POLICY "Users can access their asset risk scores" ON public.asset_risk_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their integrations" ON public.security_integrations FOR ALL USING (auth.uid() = user_id);

-- Auto-generate case numbers
CREATE OR REPLACE FUNCTION public.generate_mdr_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 'VGD-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.mdr_cases;
    
    NEW.case_number := 'VGD-' || LPAD(next_number::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_mdr_case_number
    BEFORE INSERT ON public.mdr_cases
    FOR EACH ROW
    WHEN (NEW.case_number IS NULL)
    EXECUTE FUNCTION public.generate_mdr_case_number();

-- Update timestamps trigger
CREATE TRIGGER update_mdr_cases_updated_at
    BEFORE UPDATE ON public.mdr_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yara_rules_updated_at
    BEFORE UPDATE ON public.yara_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_risk_scores_updated_at
    BEFORE UPDATE ON public.asset_risk_scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_integrations_updated_at
    BEFORE UPDATE ON public.security_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();