export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'together';

export interface AIProviderKey {
  id: string;
  user_id: string;
  provider: AIProvider;
  key_prefix: string;
  key_suffix: string;
  is_active: boolean;
  is_valid: boolean;
  last_validated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  icon: string;
  keyPrefix: string;
  models: AIModelConfig[];
  docsUrl: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  description: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-4o, o1, o3 models',
    icon: '🤖',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1', provider: 'openai', contextWindow: 128000, description: 'Latest GPT-4 model' },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, description: 'Optimized GPT-4' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, description: 'Fast & affordable' },
      { id: 'o1-preview', name: 'o1 Preview', provider: 'openai', contextWindow: 128000, description: 'Advanced reasoning' },
      { id: 'o1-mini', name: 'o1 Mini', provider: 'openai', contextWindow: 128000, description: 'Fast reasoning' },
      { id: 'o3-mini', name: 'o3 Mini', provider: 'openai', contextWindow: 200000, description: 'Next-gen reasoning' },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 4 Opus, Sonnet, Haiku models',
    icon: '🧠',
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', contextWindow: 200000, description: 'Most capable' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextWindow: 200000, description: 'Balanced performance' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: 200000, description: 'Fast & efficient' },
    ]
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 2.5 Pro & Flash models',
    icon: '✨',
    keyPrefix: 'AI',
    docsUrl: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', contextWindow: 1000000, description: '1M context window' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', contextWindow: 1000000, description: 'Fast with 1M context' },
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral Large & Mixtral models',
    icon: '🌀',
    keyPrefix: '',
    docsUrl: 'https://console.mistral.ai/api-keys',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', contextWindow: 128000, description: 'Most capable Mistral' },
      { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'mistral', contextWindow: 65000, description: 'MoE architecture' },
    ]
  },
  {
    id: 'together',
    name: 'Together AI',
    description: 'Llama 3.3, Llama 3.1 models',
    icon: '🦙',
    keyPrefix: '',
    docsUrl: 'https://api.together.ai/settings/api-keys',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', provider: 'together', contextWindow: 131072, description: 'Latest Llama' },
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', name: 'Llama 3.1 405B', provider: 'together', contextWindow: 131072, description: 'Largest open model' },
    ]
  }
];

export const getProviderById = (id: AIProvider): AIProviderConfig | undefined => {
  return AI_PROVIDERS.find(p => p.id === id);
};

export const getAllModels = (): AIModelConfig[] => {
  return AI_PROVIDERS.flatMap(p => p.models);
};

export const getModelsByProvider = (provider: AIProvider): AIModelConfig[] => {
  return AI_PROVIDERS.find(p => p.id === provider)?.models || [];
};
