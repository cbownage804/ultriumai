export interface KnowledgeSource {
  id: string;
  type: 'text' | 'url' | 'file';
  name: string;
  content: string;
  addedAt: Date;
}

export interface GPTAction {
  id: string;
  name: string;
  description: string;
  type: 'web_search' | 'url_scrape' | 'api_call' | 'image_gen' | 'code_interpreter';
  enabled: boolean;
  config?: Record<string, string>;
}

export interface WidgetTheme {
  background: string;
  text_color: string;
  user_bubble: string;
  user_bubble_text: string;
  assistant_bubble: string;
  assistant_bubble_text: string;
  input_background: string;
  input_text: string;
  input_border: string;
  header_background: string;
  starter_background: string;
  starter_text: string;
}

export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  background: '#ffffff',
  text_color: '#1f2937',
  user_bubble: '', // falls back to theme_color
  user_bubble_text: '#ffffff',
  assistant_bubble: '#f3f4f6',
  assistant_bubble_text: '#1f2937',
  input_background: '#ffffff',
  input_text: '#374151',
  input_border: '#e5e7eb',
  header_background: '', // falls back to transparent
  starter_background: '', // falls back to theme_color
  starter_text: '#ffffff',
};

export interface GPTConfig {
  name: string;
  description: string;
  system_prompt: string;
  avatar_url?: string;
  theme_color: string;
  widget_theme: WidgetTheme;
  welcome_message: string;
  starter_questions: string[];
  preferred_model: string;
  enable_web_search: boolean;
  communication_style: string;
  expertise_areas: string;
  category: string;
  features: string[];
  placeholder_prompt: string;
  knowledge_sources: KnowledgeSource[];
  actions: GPTAction[];
  embed_allowed_domains: string[];
  embed_style: 'bubble' | 'inline' | 'fullpage';
}

export const DEFAULT_GPT_CONFIG: GPTConfig = {
  name: '',
  description: '',
  system_prompt: '',
  avatar_url: '',
  theme_color: '#6366f1',
  widget_theme: { ...DEFAULT_WIDGET_THEME },
  welcome_message: '',
  starter_questions: [],
  preferred_model: 'google/gemini-3-flash-preview',
  enable_web_search: false,
  communication_style: '',
  expertise_areas: '',
  category: 'general',
  features: [],
  placeholder_prompt: 'Ask me anything...',
  knowledge_sources: [],
  actions: [],
  embed_allowed_domains: [],
  embed_style: 'bubble',
};

export interface GPTBuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  configUpdate?: Partial<GPTConfig>;
  imageUrls?: string[];
}
