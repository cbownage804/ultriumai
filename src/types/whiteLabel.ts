export interface WhiteLabelConfig {
  id?: string;
  user_id?: string;
  company_name: string;
  company_logo: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  custom_domain: string;
  favicon_url: string;
  custom_css: string;
  footer_text: string;
  hide_powered_by: boolean;
  custom_login_page: boolean;
  email_templates: {
    welcome: string;
    password_reset: string;
    invitation: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface MSPClientWhiteLabelConfig {
  id?: string;
  msp_user_id?: string;
  client_id: string;
  client_name: string;
  company_name: string;
  company_logo: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  custom_domain: string;
  favicon_url: string;
  custom_css: string;
  footer_text: string;
  hide_powered_by: boolean;
  custom_login_page: boolean;
  email_templates: {
    welcome: string;
    password_reset: string;
    invitation: string;
  };
  co_management_enabled: boolean;
  client_can_edit: boolean;
  msp_approval_required: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WhiteLabelChangeRequest {
  id?: string;
  config_id: string;
  requested_by: string;
  request_type: 'client_update' | 'msp_update';
  changes: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ColorOption {
  key: string;
  label: string;
  description: string;
}