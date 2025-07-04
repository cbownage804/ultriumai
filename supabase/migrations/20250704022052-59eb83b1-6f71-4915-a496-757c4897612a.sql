-- Create analytics tables for custom GPT tracking

-- Table to track individual GPT interactions
CREATE TABLE public.gpt_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gpt_id UUID NOT NULL,
  user_id UUID,
  session_id UUID,
  interaction_type TEXT NOT NULL, -- 'message', 'file_upload', 'export', 'share'
  response_time_ms INTEGER,
  tokens_used INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track user sessions
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  gpt_id UUID,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to track daily aggregated metrics
CREATE TABLE public.daily_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  gpt_id UUID NOT NULL,
  user_id UUID,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  average_response_time_ms INTEGER DEFAULT 0,
  average_satisfaction DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, gpt_id, user_id)
);

-- Enable RLS
ALTER TABLE public.gpt_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for gpt_analytics
CREATE POLICY "Users can view their own GPT analytics" 
ON public.gpt_analytics 
FOR SELECT 
USING (user_id = auth.uid() OR gpt_id IN (
  SELECT id FROM public.custom_gpts WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert analytics for their GPTs" 
ON public.gpt_analytics 
FOR INSERT 
WITH CHECK (gpt_id IN (
  SELECT id FROM public.custom_gpts WHERE user_id = auth.uid()
));

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid() OR gpt_id IN (
  SELECT id FROM public.custom_gpts WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage their own sessions" 
ON public.user_sessions 
FOR ALL 
USING (user_id = auth.uid() OR gpt_id IN (
  SELECT id FROM public.custom_gpts WHERE user_id = auth.uid()
));

-- Create policies for daily_analytics
CREATE POLICY "Users can view analytics for their GPTs" 
ON public.daily_analytics 
FOR SELECT 
USING (user_id = auth.uid() OR gpt_id IN (
  SELECT id FROM public.custom_gpts WHERE user_id = auth.uid()
));

CREATE POLICY "System can manage daily analytics" 
ON public.daily_analytics 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_gpt_analytics_gpt_id ON public.gpt_analytics(gpt_id);
CREATE INDEX idx_gpt_analytics_user_id ON public.gpt_analytics(user_id);
CREATE INDEX idx_gpt_analytics_created_at ON public.gpt_analytics(created_at);
CREATE INDEX idx_user_sessions_gpt_id ON public.user_sessions(gpt_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_daily_analytics_date_gpt ON public.daily_analytics(date, gpt_id);

-- Create function to update daily analytics
CREATE OR REPLACE FUNCTION public.update_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.daily_analytics (
    date, 
    gpt_id, 
    user_id, 
    total_conversations, 
    total_messages, 
    total_tokens,
    unique_users,
    average_response_time_ms,
    average_satisfaction,
    updated_at
  )
  VALUES (
    CURRENT_DATE,
    NEW.gpt_id,
    NEW.user_id,
    1,
    CASE WHEN NEW.interaction_type = 'message' THEN 1 ELSE 0 END,
    COALESCE(NEW.tokens_used, 0),
    1,
    COALESCE(NEW.response_time_ms, 0),
    NEW.satisfaction_rating,
    now()
  )
  ON CONFLICT (date, gpt_id, user_id) 
  DO UPDATE SET
    total_messages = daily_analytics.total_messages + CASE WHEN NEW.interaction_type = 'message' THEN 1 ELSE 0 END,
    total_tokens = daily_analytics.total_tokens + COALESCE(NEW.tokens_used, 0),
    average_response_time_ms = (daily_analytics.average_response_time_ms + COALESCE(NEW.response_time_ms, 0)) / 2,
    average_satisfaction = CASE 
      WHEN NEW.satisfaction_rating IS NOT NULL THEN 
        (COALESCE(daily_analytics.average_satisfaction, 0) + NEW.satisfaction_rating) / 2
      ELSE daily_analytics.average_satisfaction
    END,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for daily analytics
CREATE TRIGGER update_daily_analytics_trigger
  AFTER INSERT ON public.gpt_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_analytics();

-- Create function to update timestamps
CREATE TRIGGER update_daily_analytics_updated_at
  BEFORE UPDATE ON public.daily_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();