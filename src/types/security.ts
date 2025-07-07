export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  created_at: string;
}

export interface SecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  backup_codes?: string[];
  ip_whitelist?: string[];
  session_timeout_minutes: number;
  login_notifications: boolean;
  failed_login_attempts: number;
  last_failed_login_at?: string;
  account_locked_until?: string;
  created_at: string;
  updated_at: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'password_change' | 'two_factor_enabled' | 'two_factor_disabled' | 'api_key_created' | 'gpt_created' | 'gpt_updated' | 'gpt_deleted';
  details?: Record<string, any>;
}

// Threat Intelligence interfaces
export interface ThreatIntelligence {
  id: string;
  user_id: string;
  indicator_type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  indicator_value: string;
  reputation: 'clean' | 'questionable' | 'suspicious' | 'malicious';
  score: number;
  threats: any[]; // JSONB array of threat details
  sources: any[]; // JSONB array of sources
  last_analyzed: string;
  created_at: string;
  updated_at: string;
}

export interface ThreatFeed {
  id: string;
  indicator_type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  indicator_value: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  source: string;
  threat_types: string[];
}

// EDR interfaces
export interface EDRBehavioralAnalysis {
  id: string;
  user_id: string;
  endpoint_id: string;
  process_id: number;
  process_name: string;
  parent_process_id?: number;
  parent_process_name?: string;
  command_line: string;
  file_path: string;
  hash_sha256?: string;
  network_connections: any[];
  file_operations: any[];
  registry_operations: any[];
  memory_analysis: any;
  behavior_score: number;
  anomaly_indicators: any[];
  ai_confidence_score: number;
  threat_classification: 'benign' | 'suspicious' | 'malicious' | 'critical';
  mitre_tactics: string[];
  mitre_techniques: string[];
  analysis_timestamp: string;
  detection_rules_triggered: any[];
  status: 'monitoring' | 'blocked' | 'quarantined' | 'whitelisted';
  created_at: string;
  updated_at: string;
}

export interface EDRRealtimeAlert {
  id: string;
  user_id: string;
  endpoint_id: string;
  behavioral_analysis_id?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  attack_stage?: string;
  indicators_of_compromise: any[];
  response_actions_taken: any[];
  auto_response_enabled: boolean;
  containment_status: 'none' | 'process_blocked' | 'network_isolated' | 'endpoint_quarantined';
  analyst_assigned?: string;
  status: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}