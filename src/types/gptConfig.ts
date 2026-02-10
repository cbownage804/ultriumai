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
};

export interface GPTBuilderMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  configUpdate?: Partial<GPTConfig>;
}
