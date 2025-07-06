-- Create RMM endpoints table for client systems
CREATE TABLE public.rmm_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  os_info TEXT,
  cpu_info TEXT,
  memory_total BIGINT,
  memory_available BIGINT,
  disk_info JSONB,
  network_interfaces JSONB,
  agent_version TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, hostname)
);

-- Create RMM metrics table for performance data
CREATE TABLE public.rmm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  disk_usage NUMERIC,
  network_io BIGINT,
  processes_count INTEGER,
  services_count INTEGER,
  antivirus_status JSONB,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM alerts table
CREATE TABLE public.rmm_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create software inventory table
CREATE TABLE public.software_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  software_name TEXT NOT NULL,
  version TEXT,
  publisher TEXT,
  install_date TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, hostname, software_name)
);

-- Create antivirus scans table
CREATE TABLE public.antivirus_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  scan_duration INTEGER,
  files_scanned BIGINT,
  threats_found INTEGER DEFAULT 0,
  threats_quarantined INTEGER DEFAULT 0,
  scan_results JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create RMM command logs table
CREATE TABLE public.rmm_command_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB,
  result JSONB,
  executed_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create software deployments table
CREATE TABLE public.software_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  package_id TEXT NOT NULL,
  deployment_status TEXT NOT NULL DEFAULT 'pending',
  deployment_log TEXT,
  started_by UUID,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.rmm_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antivirus_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_deployments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MSP access
CREATE POLICY "MSPs can manage their client endpoints" ON public.rmm_endpoints
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client metrics" ON public.rmm_metrics
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can manage their client alerts" ON public.rmm_alerts
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client software inventory" ON public.software_inventory
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client antivirus scans" ON public.antivirus_scans
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client command logs" ON public.rmm_command_logs
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can manage their client software deployments" ON public.software_deployments
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_rmm_endpoints_client_id ON public.rmm_endpoints(client_id);
CREATE INDEX idx_rmm_metrics_client_hostname ON public.rmm_metrics(client_id, hostname);
CREATE INDEX idx_rmm_alerts_client_status ON public.rmm_alerts(client_id, status);
CREATE INDEX idx_software_inventory_client ON public.software_inventory(client_id, hostname);
CREATE INDEX idx_antivirus_scans_client ON public.antivirus_scans(client_id, completed_at);

-- Add timestamps triggers
CREATE TRIGGER update_rmm_endpoints_updated_at
BEFORE UPDATE ON public.rmm_endpoints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();