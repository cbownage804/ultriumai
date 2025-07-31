-- Create AI chat completion edge function for voice assistant
-- This will be handled by the existing edge functions system

-- For now, we'll create a simple table to track voice assistant interactions
CREATE TABLE IF NOT EXISTS public.voice_assistant_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voice_assistant_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for voice assistant interactions
CREATE POLICY "Users can view their own voice interactions"
  ON public.voice_assistant_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice interactions"
  ON public.voice_assistant_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice interactions"
  ON public.voice_assistant_interactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice interactions"
  ON public.voice_assistant_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_voice_interactions_user_timestamp 
  ON public.voice_assistant_interactions (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_voice_interactions_session 
  ON public.voice_assistant_interactions (session_id, timestamp DESC);