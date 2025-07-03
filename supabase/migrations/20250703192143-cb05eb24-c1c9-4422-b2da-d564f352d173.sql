-- Create integrations table for GPT connections
CREATE TABLE public.gpt_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'perplexity', 'twitter', 'webhook', 'openai_images', 'zapier'
  integration_name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  credentials_encrypted TEXT, -- encrypted API keys/tokens
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gpt_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own integrations" ON public.gpt_integrations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own integrations" ON public.gpt_integrations
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own integrations" ON public.gpt_integrations
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations" ON public.gpt_integrations
FOR DELETE USING (user_id = auth.uid());

-- Create trigger for timestamp updates
CREATE TRIGGER update_gpt_integrations_updated_at
BEFORE UPDATE ON public.gpt_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add integration settings to custom_gpts table
ALTER TABLE public.custom_gpts ADD COLUMN integration_settings JSONB DEFAULT '{}';
ALTER TABLE public.custom_gpts ADD COLUMN max_integrations INTEGER DEFAULT 3;