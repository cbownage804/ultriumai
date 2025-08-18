-- Create network_connectors table for Vanguard AI network agents
CREATE TABLE public.network_connectors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  location text NOT NULL DEFAULT 'Unknown',
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_heartbeat timestamp with time zone NOT NULL DEFAULT now(),
  network_ranges text[] DEFAULT '{}',
  capabilities text[] DEFAULT '{"discovery", "vulnerability"}',
  active_scans integer DEFAULT 0,
  system_metrics jsonb DEFAULT '{}',
  version text DEFAULT '1.0.0',
  os_info jsonb DEFAULT '{}',
  tools_available text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on network_connectors
ALTER TABLE public.network_connectors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for network_connectors
CREATE POLICY "Users can manage their own network connectors"
  ON public.network_connectors
  FOR ALL
  USING (user_id = auth.uid());

-- Create network_scan_jobs table for Vanguard AI scan jobs
CREATE TABLE public.network_scan_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  targets text[] NOT NULL DEFAULT '{}',
  scan_type text NOT NULL DEFAULT 'discovery',
  options jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  findings_count integer,
  results_summary jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on network_scan_jobs
ALTER TABLE public.network_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for network_scan_jobs
CREATE POLICY "Users can manage their own network scan jobs"
  ON public.network_scan_jobs
  FOR ALL
  USING (user_id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_network_connectors_updated_at
  BEFORE UPDATE ON public.network_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_network_scan_jobs_updated_at
  BEFORE UPDATE ON public.network_scan_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();