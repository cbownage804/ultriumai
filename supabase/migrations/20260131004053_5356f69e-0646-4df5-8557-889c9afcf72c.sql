-- Add survey tokens table for public access
CREATE TABLE IF NOT EXISTS public.vanguard_survey_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID,
  ticket_id UUID,
  ticket_title TEXT,
  client_name TEXT,
  client_email TEXT,
  technician_name TEXT,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on survey tokens
ALTER TABLE public.vanguard_survey_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can manage their survey tokens" ON public.vanguard_survey_tokens;
DROP POLICY IF EXISTS "Anyone can read survey tokens by token value" ON public.vanguard_survey_tokens;

-- RLS Policies for survey tokens
CREATE POLICY "Users can manage their survey tokens" ON public.vanguard_survey_tokens 
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read tokens for validation" ON public.vanguard_survey_tokens 
  FOR SELECT USING (true);

-- Allow public insert on survey responses (for anonymous survey submission)
DROP POLICY IF EXISTS "Anyone can insert survey responses" ON public.vanguard_survey_responses;
CREATE POLICY "Anyone can insert survey responses" ON public.vanguard_survey_responses 
  FOR INSERT WITH CHECK (true);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_vanguard_survey_tokens_token ON public.vanguard_survey_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vanguard_survey_tokens_expires ON public.vanguard_survey_tokens(expires_at);