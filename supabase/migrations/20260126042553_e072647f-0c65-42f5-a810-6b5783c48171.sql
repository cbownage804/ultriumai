-- Create table for user-managed AI provider API keys
CREATE TABLE public.user_ai_provider_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'mistral', 'together'
  key_hash TEXT NOT NULL, -- Store hashed version for verification
  key_prefix TEXT NOT NULL, -- First few chars for display (e.g., "sk-...abc")
  key_suffix TEXT NOT NULL, -- Last few chars for display
  is_active BOOLEAN DEFAULT true,
  is_valid BOOLEAN DEFAULT true, -- Track if key has been validated
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_ai_provider_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own keys
CREATE POLICY "Users can view their own provider keys"
ON public.user_ai_provider_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own keys
CREATE POLICY "Users can insert their own provider keys"
ON public.user_ai_provider_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own keys
CREATE POLICY "Users can update their own provider keys"
ON public.user_ai_provider_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own keys
CREATE POLICY "Users can delete their own provider keys"
ON public.user_ai_provider_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_ai_provider_keys_updated_at
BEFORE UPDATE ON public.user_ai_provider_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();