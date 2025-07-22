
-- Create device_commands table for cloud→device command queuing
CREATE TABLE IF NOT EXISTS public.device_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  acked_at timestamptz,
  done_at timestamptz,
  CONSTRAINT device_commands_status_check CHECK (status IN ('queued', 'sent', 'ack', 'done', 'error'))
);

-- Create device_events table for device→cloud event logging
CREATE TABLE IF NOT EXISTS public.device_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS device_commands_device_id_idx ON public.device_commands (device_id);
CREATE INDEX IF NOT EXISTS device_commands_status_idx ON public.device_commands (status);
CREATE INDEX IF NOT EXISTS device_commands_created_at_idx ON public.device_commands (created_at);

CREATE INDEX IF NOT EXISTS device_events_device_id_idx ON public.device_events (device_id);
CREATE INDEX IF NOT EXISTS device_events_type_idx ON public.device_events (event_type);
CREATE INDEX IF NOT EXISTS device_events_created_at_idx ON public.device_events (created_at);

-- Enable RLS on new tables
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_commands
CREATE POLICY "Users can manage device commands for their devices" 
ON public.device_commands 
FOR ALL 
USING (
  device_id IN (
    SELECT id FROM public.safenet_devices 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage device commands" 
ON public.device_commands 
FOR ALL 
USING (true);

-- RLS policies for device_events
CREATE POLICY "Users can view device events for their devices" 
ON public.device_events 
FOR SELECT 
USING (
  device_id IN (
    SELECT id FROM public.safenet_devices 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert device events" 
ON public.device_events 
FOR INSERT 
WITH CHECK (true);

-- Helper function to get alert counts by device
CREATE OR REPLACE FUNCTION public.get_device_alert_counts(p_device_id uuid)
RETURNS TABLE(critical bigint, high bigint, medium bigint, low bigint, info bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END), 0) as critical,
    COALESCE(SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END), 0) as high,
    COALESCE(SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END), 0) as medium,
    COALESCE(SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END), 0) as low,
    COALESCE(SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END), 0) as info
  FROM public.security_events se
  WHERE se.device_id = p_device_id
  AND se.status IN ('open', 'investigating');
$$;

-- Helper function to get latest scan info for device
CREATE OR REPLACE FUNCTION public.get_device_latest_scan(p_device_id uuid)
RETURNS TABLE(scan_id uuid, scanned_at timestamptz, devices_found integer, scan_duration integer, scan_type text)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    ns.id as scan_id,
    ns.scanned_at,
    ns.devices_found,
    ns.scan_duration,
    ns.scan_type
  FROM public.network_scans ns
  WHERE ns.connector_id = (
    SELECT connector_key FROM public.safenet_devices 
    WHERE id = p_device_id
  )
  ORDER BY ns.scanned_at DESC
  LIMIT 1;
$$;
