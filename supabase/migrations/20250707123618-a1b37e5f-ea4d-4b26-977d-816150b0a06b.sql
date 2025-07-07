-- Check if remote_sessions table exists, if not create it
CREATE TABLE IF NOT EXISTS public.remote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'desktop',
  status TEXT NOT NULL DEFAULT 'active',
  session_token UUID NOT NULL DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_token)
);

-- Enable RLS
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own remote sessions" ON public.remote_sessions
FOR ALL USING (user_id = auth.uid());

-- Add update trigger
CREATE TRIGGER update_remote_sessions_updated_at
  BEFORE UPDATE ON public.remote_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();