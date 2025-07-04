export interface ApiKey {
  id: string;
  user_id: string;
  gpt_id?: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: {
    chat: boolean;
    analytics: boolean;
  };
  rate_limit_rpm: number;
  rate_limit_rpd: number;
  usage_count: number;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiUsageLog {
  id: string;
  api_key_id: string;
  gpt_id?: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number;
  tokens_used?: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
  gpt_id?: string;
  permissions: {
    chat: boolean;
    analytics: boolean;
  };
  rate_limit_rpm?: number;
  rate_limit_rpd?: number;
  expires_at?: string;
}