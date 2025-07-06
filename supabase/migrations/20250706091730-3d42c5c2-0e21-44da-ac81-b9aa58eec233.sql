-- Create RMM-related tables for the agent functionality

-- RMM Endpoints (registered agents/devices)
CREATE TABLE public.rmm_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  os_info TEXT,
  cpu_info TEXT,
  memory_total BIGINT,
  memory_available BIGINT,
  disk_info JSONB DEFAULT '{}',
  network_interfaces JSONB DEFAULT '[]',
  agent_version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, hostname)
);

-- RMM Metrics (system performance data)
CREATE TABLE public.rmm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  disk_usage NUMERIC,
  network_io BIGINT DEFAULT 0,
  processes_count INTEGER,
  services_count INTEGER,
  antivirus_status JSONB DEFAULT '{}',
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Software Inventory
CREATE TABLE public.software_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  software_name TEXT NOT NULL,
  version TEXT,
  publisher TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, hostname, software_name)
);

-- RMM Alerts
CREATE TABLE public.rmm_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RMM Command Logs
CREATE TABLE public.rmm_command_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  result JSONB,
  executed_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Software Deployments
CREATE TABLE public.software_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  package_id TEXT NOT NULL,
  deployment_status TEXT NOT NULL,
  deployment_log TEXT,
  started_by UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rmm_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_deployments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MSP access
CREATE POLICY "MSPs can manage their client RMM endpoints" ON public.rmm_endpoints
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client metrics" ON public.rmm_metrics
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client software inventory" ON public.software_inventory
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can manage their client alerts" ON public.rmm_alerts
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can view their client command logs" ON public.rmm_command_logs
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can manage their software deployments" ON public.software_deployments
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
);

-- Add update triggers
CREATE TRIGGER update_rmm_endpoints_updated_at
  BEFORE UPDATE ON public.rmm_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rmm_alerts_updated_at
  BEFORE UPDATE ON public.rmm_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();