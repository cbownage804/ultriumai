export interface GPTTemplateConfig {
  // General tab
  preferred_model?: string;
  theme_color?: string;
  secondary_color?: string;
  background_type?: 'color' | 'image';
  background_color?: string;
  
  // Persona tab
  welcome_message?: string;
  communication_style?: string;
  expertise_areas?: string;
  
  // Conversation tab
  language?: string;
  placeholder_prompt?: string;
  loading_indicator?: 'dots' | 'custom';
  loading_message?: string;
  starter_header?: string;
  starter_expand_text?: string;
  starter_collapse_text?: string;
  message_ending?: string;
  error_message?: string;
  conversation_duration?: '24h' | 'unlimited';
  
  // Citations tab
  idk_message?: string;
  show_citations?: 'none' | 'inline' | 'footnotes' | 'end';
  mention_sources?: 'yes' | 'no';
  
  // Intelligence tab
  capability_mode?: 'fastest' | 'optimal' | 'relevance' | 'complex';
  knowledge_source?: 'data_and_general' | 'data_only' | 'general_only';
  enable_web_search?: boolean;
  temperature?: number;
  max_tokens?: number;
  
  // Advanced tab
  enable_feedback?: boolean;
  enable_sharing?: boolean;
  enable_export?: boolean;
  remove_branding?: boolean;
  agent_title?: string;
  title_color?: string;
  spotlight_avatar?: boolean;
  show_user_avatar?: boolean;
  avatar_orientation?: 'agent_left' | 'agent_right';
  terms_of_service?: string;
  
  // Security tab
  anti_hallucination?: boolean;
  visibility?: 'private' | 'public';
  enable_recaptcha?: boolean;
  whitelisted_domains?: string;
  retention_period?: 'custom' | '12_months' | 'never';
  retention_days?: number;
  
  // Voice tab
  enable_voice_input?: boolean;
  enable_voice_output?: boolean;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  voice_speed?: number;
  voice_autoplay?: boolean;
}

export interface GPTTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  system_prompt: string;
  starter_questions: string[];
  icon: string;
  preview_image?: string;
  use_count: number;
  rating: number;
  created_by: string;
  created_at: string;
  features: string[];
  config: GPTTemplateConfig;
  credit_cost?: number; // Credits required to install (default: 50)
}
