-- =============================================================================
-- Vanguard Pursuit XDR - Enterprise Security Tables
-- =============================================================================

-- XDR Threats (detected threats with full context)
CREATE TABLE public.xdr_threats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    threat_id TEXT NOT NULL,
    threat_name TEXT NOT NULL,
    threat_type TEXT NOT NULL, -- malware, ransomware, fileless, persistence, lateral_movement, exfiltration, c2
    severity TEXT NOT NULL DEFAULT 'medium', -- critical, high, medium, low, info
    status TEXT NOT NULL DEFAULT 'detected', -- detected, investigating, contained, remediated, false_positive
    mitre_tactic TEXT,
    mitre_technique TEXT,
    mitre_subtechnique TEXT,
    detection_source TEXT, -- fim, registry, network, behavioral, yara, threat_intel, edr
    file_path TEXT,
    file_hash TEXT,
    process_name TEXT,
    process_id INTEGER,
    parent_process TEXT,
    command_line TEXT,
    user_account TEXT,
    source_ip TEXT,
    destination_ip TEXT,
    destination_port INTEGER,
    dns_query TEXT,
    raw_event JSONB,
    ai_analysis TEXT,
    ai_confidence NUMERIC(3,2),
    remediation_action TEXT,
    remediated_at TIMESTAMPTZ,
    remediated_by TEXT,
    automation_mode TEXT DEFAULT 'alert_only', -- full_auto, guided, alert_only
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Indicators of Compromise (IOC)
CREATE TABLE public.xdr_iocs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    ioc_type TEXT NOT NULL, -- hash_md5, hash_sha1, hash_sha256, ip, domain, url, email, file_path, registry_key
    ioc_value TEXT NOT NULL,
    threat_name TEXT,
    severity TEXT DEFAULT 'medium',
    source TEXT, -- manual, virustotal, alienvault, abuse_ch, misp, crowdstrike
    confidence INTEGER DEFAULT 50, -- 0-100
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    tags TEXT[],
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    matches_count INTEGER DEFAULT 0,
    last_matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, ioc_type, ioc_value)
);

-- XDR YARA Rules
CREATE TABLE public.xdr_yara_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    rule_content TEXT NOT NULL,
    description TEXT,
    author TEXT,
    category TEXT, -- malware, ransomware, apt, exploit, pup, hacking_tool
    severity TEXT DEFAULT 'medium',
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    matches_count INTEGER DEFAULT 0,
    last_matched_at TIMESTAMPTZ,
    false_positives INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Threat Intelligence Feeds
CREATE TABLE public.xdr_threat_feeds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    feed_name TEXT NOT NULL,
    feed_url TEXT,
    feed_type TEXT NOT NULL, -- ioc, yara, stix, misp
    provider TEXT, -- virustotal, alienvault, abuse_ch, misp, custom
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    sync_interval_hours INTEGER DEFAULT 24,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    ioc_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Forensic Collections
CREATE TABLE public.xdr_forensics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    threat_id UUID REFERENCES public.xdr_threats(id) ON DELETE SET NULL,
    collection_type TEXT NOT NULL, -- memory_dump, process_snapshot, event_logs, registry_export, file_collection, timeline
    status TEXT DEFAULT 'pending', -- pending, collecting, completed, failed
    file_path TEXT,
    file_size_bytes BIGINT,
    file_hash TEXT,
    storage_url TEXT,
    metadata JSONB,
    collected_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Ransomware Events
CREATE TABLE public.xdr_ransomware_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- encryption_detected, honeypot_triggered, shadow_copy_attack, mass_rename, extension_change
    severity TEXT DEFAULT 'critical',
    status TEXT DEFAULT 'detected', -- detected, blocked, contained, rolled_back
    process_name TEXT,
    process_id INTEGER,
    files_affected INTEGER DEFAULT 0,
    directories_affected INTEGER DEFAULT 0,
    encryption_pattern TEXT,
    ransom_note_content TEXT,
    ransom_note_path TEXT,
    honeypot_file TEXT,
    shadow_copies_protected BOOLEAN DEFAULT false,
    rollback_available BOOLEAN DEFAULT false,
    rollback_initiated_at TIMESTAMPTZ,
    rollback_completed_at TIMESTAMPTZ,
    files_recovered INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR File Integrity Monitoring Baselines
CREATE TABLE public.xdr_fim_baselines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_size BIGINT,
    file_permissions TEXT,
    file_owner TEXT,
    is_critical BOOLEAN DEFAULT false,
    baseline_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR FIM Changes (detected file changes)
CREATE TABLE public.xdr_fim_changes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    baseline_id UUID REFERENCES public.xdr_fim_baselines(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    change_type TEXT NOT NULL, -- created, modified, deleted, permissions_changed, owner_changed
    old_hash TEXT,
    new_hash TEXT,
    old_size BIGINT,
    new_size BIGINT,
    process_name TEXT,
    process_id INTEGER,
    user_account TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    threat_id UUID REFERENCES public.xdr_threats(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Network Connections (suspicious network activity)
CREATE TABLE public.xdr_network_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- connection, dns_query, c2_beacon, data_exfil, port_scan
    protocol TEXT,
    source_ip TEXT,
    source_port INTEGER,
    destination_ip TEXT,
    destination_port INTEGER,
    destination_domain TEXT,
    dns_query TEXT,
    dns_response TEXT[],
    process_name TEXT,
    process_id INTEGER,
    bytes_sent BIGINT,
    bytes_received BIGINT,
    connection_state TEXT,
    is_blocked BOOLEAN DEFAULT false,
    is_suspicious BOOLEAN DEFAULT false,
    threat_intel_match BOOLEAN DEFAULT false,
    ioc_id UUID REFERENCES public.xdr_iocs(id) ON DELETE SET NULL,
    threat_id UUID REFERENCES public.xdr_threats(id) ON DELETE SET NULL,
    geo_country TEXT,
    geo_city TEXT,
    asn TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Automation Policies (per device/org automation settings)
CREATE TABLE public.xdr_automation_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    policy_name TEXT NOT NULL,
    policy_scope TEXT DEFAULT 'organization', -- organization, device_group, device
    scope_id TEXT, -- org id, group id, or device id
    automation_mode TEXT NOT NULL DEFAULT 'alert_only', -- full_auto, guided, alert_only
    auto_isolate_on_critical BOOLEAN DEFAULT false,
    auto_kill_malicious_processes BOOLEAN DEFAULT true,
    auto_quarantine_files BOOLEAN DEFAULT true,
    auto_block_c2 BOOLEAN DEFAULT true,
    auto_protect_shadow_copies BOOLEAN DEFAULT true,
    require_approval_for TEXT[], -- array of actions requiring approval
    notification_channels JSONB DEFAULT '{"email": true, "slack": false, "webhook": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Response Actions Log
CREATE TABLE public.xdr_response_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    threat_id UUID REFERENCES public.xdr_threats(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- isolate, unisolate, kill_process, quarantine_file, delete_file, block_ip, block_domain, rollback, collect_forensics
    action_status TEXT DEFAULT 'pending', -- pending, approved, executing, completed, failed, rejected
    action_payload JSONB,
    initiated_by TEXT, -- system, technician_id, ai
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result JSONB,
    error_message TEXT,
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XDR Attack Timeline Events (for investigation)
CREATE TABLE public.xdr_timeline_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
    threat_id UUID REFERENCES public.xdr_threats(id) ON DELETE SET NULL,
    incident_id UUID, -- for grouping related events
    event_type TEXT NOT NULL,
    event_source TEXT,
    event_data JSONB NOT NULL,
    process_tree JSONB,
    mitre_mapping JSONB,
    severity TEXT,
    sequence_number INTEGER,
    event_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.xdr_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_iocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_yara_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_threat_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_forensics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_ransomware_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_fim_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_fim_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_network_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_automation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_response_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xdr_timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all XDR tables
CREATE POLICY "Users can manage their XDR threats" ON public.xdr_threats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their IOCs" ON public.xdr_iocs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their YARA rules" ON public.xdr_yara_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their threat feeds" ON public.xdr_threat_feeds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their forensics" ON public.xdr_forensics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their ransomware events" ON public.xdr_ransomware_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their FIM baselines" ON public.xdr_fim_baselines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their FIM changes" ON public.xdr_fim_changes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their network events" ON public.xdr_network_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their automation policies" ON public.xdr_automation_policies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their response actions" ON public.xdr_response_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their timeline events" ON public.xdr_timeline_events FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_xdr_threats_agent ON public.xdr_threats(agent_id);
CREATE INDEX idx_xdr_threats_status ON public.xdr_threats(status);
CREATE INDEX idx_xdr_threats_severity ON public.xdr_threats(severity);
CREATE INDEX idx_xdr_threats_created ON public.xdr_threats(created_at DESC);
CREATE INDEX idx_xdr_iocs_type_value ON public.xdr_iocs(ioc_type, ioc_value);
CREATE INDEX idx_xdr_iocs_active ON public.xdr_iocs(is_active) WHERE is_active = true;
CREATE INDEX idx_xdr_network_destination ON public.xdr_network_events(destination_ip, destination_domain);
CREATE INDEX idx_xdr_timeline_incident ON public.xdr_timeline_events(incident_id);
CREATE INDEX idx_xdr_timeline_time ON public.xdr_timeline_events(event_time DESC);
CREATE INDEX idx_xdr_ransomware_agent ON public.xdr_ransomware_events(agent_id);
CREATE INDEX idx_xdr_response_status ON public.xdr_response_actions(action_status);