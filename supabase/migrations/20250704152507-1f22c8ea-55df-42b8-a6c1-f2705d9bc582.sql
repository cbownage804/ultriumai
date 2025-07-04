-- Create actions table to store GPT actions/integrations
CREATE TABLE public.gpt_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('document', 'api', 'webhook', 'database', 'security')),
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_beta BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gpt_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for gpt_actions
CREATE POLICY "Users can view their own GPT actions" 
ON public.gpt_actions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own GPT actions" 
ON public.gpt_actions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own GPT actions" 
ON public.gpt_actions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own GPT actions" 
ON public.gpt_actions 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gpt_actions_updated_at
BEFORE UPDATE ON public.gpt_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create action execution logs table
CREATE TABLE public.action_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES public.gpt_actions(id) ON DELETE CASCADE,
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'error', 'pending')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.action_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for action_execution_logs
CREATE POLICY "Users can view their own action logs" 
ON public.action_execution_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert action logs" 
ON public.action_execution_logs 
FOR INSERT 
WITH CHECK (true);