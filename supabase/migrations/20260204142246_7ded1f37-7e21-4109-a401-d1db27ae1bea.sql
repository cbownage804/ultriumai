-- Add availability monitoring field to vanguard_agents
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS availability_monitoring_enabled BOOLEAN DEFAULT false;

-- Create device availability alerts table to track offline notifications
CREATE TABLE IF NOT EXISTS public.device_availability_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'device_offline',
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_device_availability_device_id ON public.device_availability_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_availability_resolved ON public.device_availability_alerts(resolved_at) WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE public.device_availability_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own alerts"
ON public.device_availability_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
ON public.device_availability_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.device_availability_alerts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON public.device_availability_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Also allow service role to manage alerts (for edge functions)
CREATE POLICY "Service role can manage all alerts"
ON public.device_availability_alerts
FOR ALL
USING (true)
WITH CHECK (true);