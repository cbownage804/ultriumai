-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk-proj_abc...")
  permissions JSONB NOT NULL DEFAULT '{"chat": true, "analytics": false}'::jsonb,
  rate_limit_rpm INTEGER DEFAULT 60, -- requests per minute
  rate_limit_rpd INTEGER DEFAULT 1000, -- requests per day
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API usage logs table
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys" 
ON public.api_keys FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys" 
ON public.api_keys FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys FOR DELETE 
USING (user_id = auth.uid());

-- API Usage Logs policies
CREATE POLICY "Users can view logs for their API keys" 
ON public.api_usage_logs FOR SELECT 
USING (
  api_key_id IN (
    SELECT id FROM public.api_keys WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert usage logs" 
ON public.api_usage_logs FOR INSERT 
WITH CHECK (true); -- Edge functions will insert logs

-- Add trigger for API keys updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_gpt_id ON public.api_keys(gpt_id);
CREATE INDEX idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);