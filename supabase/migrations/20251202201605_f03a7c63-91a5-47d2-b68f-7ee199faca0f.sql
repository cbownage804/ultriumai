-- Create vanguard_agents table for tracking Pi/Ubuntu devices
CREATE TABLE public.vanguard_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  device_id text NOT NULL UNIQUE,
  name text NOT NULL,
  location text,
  ip_address inet,
  vpn_ip text,
  api_endpoint text,
  agent_version text,
  firmware_version text,
  hailo_board_name text,
  hailo_status jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'offline',
  last_heartbeat timestamptz,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create vanguard_agent_metrics table for time-series data
CREATE TABLE public.vanguard_agent_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  cpu_percent numeric,
  memory_percent numeric,
  disk_percent numeric,
  network_rx_bytes bigint,
  network_tx_bytes bigint,
  temperature numeric,
  hailo_status jsonb DEFAULT '{}'::jsonb,
  custom_metrics jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Create vanguard_agent_commands table for bidirectional communication
CREATE TABLE public.vanguard_agent_commands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  command_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  response jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  completed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX idx_vanguard_agents_user_id ON public.vanguard_agents(user_id);
CREATE INDEX idx_vanguard_agents_device_id ON public.vanguard_agents(device_id);
CREATE INDEX idx_vanguard_agent_metrics_agent_id ON public.vanguard_agent_metrics(agent_id);
CREATE INDEX idx_vanguard_agent_metrics_recorded_at ON public.vanguard_agent_metrics(recorded_at DESC);
CREATE INDEX idx_vanguard_agent_commands_agent_id ON public.vanguard_agent_commands(agent_id);
CREATE INDEX idx_vanguard_agent_commands_status ON public.vanguard_agent_commands(status);

-- Enable RLS
ALTER TABLE public.vanguard_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_agent_commands ENABLE ROW LEVEL SECURITY;

-- RLS policies for vanguard_agents
CREATE POLICY "Users can view their own vanguard agents"
  ON public.vanguard_agents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own vanguard agents"
  ON public.vanguard_agents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vanguard agents"
  ON public.vanguard_agents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own vanguard agents"
  ON public.vanguard_agents FOR DELETE
  USING (user_id = auth.uid());

-- RLS policies for vanguard_agent_metrics
CREATE POLICY "Users can view metrics for their agents"
  ON public.vanguard_agent_metrics FOR SELECT
  USING (agent_id IN (SELECT id FROM public.vanguard_agents WHERE user_id = auth.uid()));

CREATE POLICY "System can insert metrics"
  ON public.vanguard_agent_metrics FOR INSERT
  WITH CHECK (true);

-- RLS policies for vanguard_agent_commands
CREATE POLICY "Users can manage commands for their agents"
  ON public.vanguard_agent_commands FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "System can update command status"
  ON public.vanguard_agent_commands FOR UPDATE
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_vanguard_agents_updated_at
  BEFORE UPDATE ON public.vanguard_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();