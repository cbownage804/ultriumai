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

export interface ColorOption {
  key: string;
  label: string;
  description: string;
}