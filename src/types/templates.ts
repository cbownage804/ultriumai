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
  config: {
    preferred_model?: string;
    enable_web_search?: boolean;
    temperature?: number;
    max_tokens?: number;
    theme_color?: string;
    placeholder_prompt?: string;
  };
}