-- =============================================================================
-- Vanguard Security Events Table for Windows Defender Integration
-- =============================================================================

-- Create security events table to store threat detections from Windows Defender
CREATE TABLE IF NOT EXISTS public.vanguard_security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'threat_detected',
  threat_id TEXT,
  threat_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  process_name TEXT,
  resources TEXT[],
  action_success BOOLEAN DEFAULT false,
  threat_status TEXT DEFAULT 'detected',
  detected_at TIMESTAMP WITH TIME ZONE,
  remediated_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add security_status column to vanguard_agents if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vanguard_agents' AND column_name = 'security_status'
  ) THEN
    ALTER TABLE public.vanguard_agents ADD COLUMN security_status JSONB;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_agent_id ON public.vanguard_security_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.vanguard_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.vanguard_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_detected_at ON public.vanguard_security_events(detected_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_events_threat_unique ON public.vanguard_security_events(agent_id, threat_id);

-- Enable RLS
ALTER TABLE public.vanguard_security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own security events" 
  ON public.vanguard_security_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert security events" 
  ON public.vanguard_security_events 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can delete their own security events" 
  ON public.vanguard_security_events 
  FOR DELETE 
  USING (auth.uid() = user_id);