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