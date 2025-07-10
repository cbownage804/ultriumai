-- Migration: Enhance existing RMM tables for MVP functionality
-- Add rustdesk_id to existing rmm_devices table
ALTER TABLE public.rmm_devices 
ADD COLUMN IF NOT EXISTS rustdesk_id text;

-- Add index for rustdesk_id lookups
CREATE INDEX IF NOT EXISTS idx_rmm_devices_rustdesk_id ON public.rmm_devices(rustdesk_id);

-- Create rmm_metrics table for historical device metrics
CREATE TABLE IF NOT EXISTS public.rmm_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id uuid NOT NULL REFERENCES public.rmm_devices(id) ON DELETE CASCADE,
  cpu_usage float,
  ram_usage float,
  disk_usage float,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create rmm_command_results table for storing command outputs
CREATE TABLE IF NOT EXISTS public.rmm_command_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id uuid NOT NULL REFERENCES public.rmm_agent_commands(id) ON DELETE CASCADE,
  output text,
  error text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.rmm_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_command_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for rmm_metrics
CREATE POLICY "Users can manage their own device metrics" ON public.rmm_metrics FOR ALL USING (user_id = auth.uid());

-- RLS policies for rmm_command_results (inherit user access through command relationship)
CREATE POLICY "Users can manage command results for their commands" ON public.rmm_command_results FOR ALL 
USING (command_id IN (SELECT id FROM public.rmm_agent_commands WHERE user_id = auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rmm_metrics_device_id ON public.rmm_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_rmm_metrics_timestamp ON public.rmm_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_rmm_metrics_user_id ON public.rmm_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_rmm_command_results_command_id ON public.rmm_command_results(command_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_rmm_metrics_updated_at BEFORE UPDATE ON public.rmm_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rmm_command_results_updated_at BEFORE UPDATE ON public.rmm_command_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add helper function to check if device is online (based on last_seen)
CREATE OR REPLACE FUNCTION public.is_device_online(last_seen timestamptz)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT last_seen > (now() - interval '5 minutes');
$$;