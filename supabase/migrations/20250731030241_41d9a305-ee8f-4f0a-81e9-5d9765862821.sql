-- Create security alerts table (notifications table already exists)
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'dismissed')),
  source_system TEXT NOT NULL DEFAULT 'ultrium',
  affected_systems JSONB DEFAULT '[]',
  indicators JSONB DEFAULT '{}',
  remediation_steps TEXT,
  resolution_notes TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for security alerts
CREATE POLICY "Users can view their own security alerts"
  ON public.security_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security alerts"
  ON public.security_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security alerts"
  ON public.security_alerts
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_status 
  ON public.security_alerts (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_alerts_severity
  ON public.security_alerts (user_id, severity, created_at DESC);

-- Create trigger for updated_at on security_alerts
CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;