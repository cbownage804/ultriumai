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

export interface GPTConfig {
  name: string;
  description: string;
  system_prompt: string;
  avatar_url?: string;
  theme_color: string;
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
  welcome_message: '',
  starter_questions: [],
  preferred_model: 'gpt-4o-mini',
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
}
