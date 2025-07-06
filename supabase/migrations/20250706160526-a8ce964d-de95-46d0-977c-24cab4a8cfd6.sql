-- Create RMM endpoints table to track all managed devices
CREATE TABLE public.rmm_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  ip_address INET,
  mac_address TEXT,
  device_type TEXT NOT NULL DEFAULT 'workstation', -- workstation, server, network_device
  os_info TEXT,
  cpu_info TEXT,
  memory_total BIGINT,
  memory_available BIGINT,
  disk_info JSONB DEFAULT '{}',
  network_interfaces JSONB DEFAULT '[]',
  installed_software JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  processes JSONB DEFAULT '[]',
  agent_version TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'offline', -- online, offline, warning, critical
  location TEXT,
  department TEXT,
  asset_tag TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  warranty_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, hostname)
);

-- Create RMM metrics table for historical performance data
CREATE TABLE public.rmm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  network_io BIGINT DEFAULT 0,
  processes_count INTEGER DEFAULT 0,
  services_count INTEGER DEFAULT 0,
  uptime_seconds BIGINT DEFAULT 0,
  temperature DECIMAL(5,2),
  antivirus_status JSONB DEFAULT '{}',
  backup_status JSONB DEFAULT '{}',
  patch_status JSONB DEFAULT '{}',
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM alerts table
CREATE TABLE public.rmm_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT,
  alert_type TEXT NOT NULL, -- performance, security, service, storage, network
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL, -- system_monitor, antivirus_monitor, service_monitor, etc.
  status TEXT NOT NULL DEFAULT 'open', -- open, acknowledged, resolved, escalated
  metadata JSONB DEFAULT '{}',
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID,
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM command logs table for remote operations
CREATE TABLE public.rmm_command_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  command_type TEXT NOT NULL, -- script, restart, update, scan, etc.
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  result JSONB DEFAULT '{}',
  output TEXT,
  error_message TEXT,
  executed_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER
);

-- Create software inventory table
CREATE TABLE public.software_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  software_name TEXT NOT NULL,
  version TEXT,
  publisher TEXT,
  install_date DATE,
  size_mb INTEGER,
  location TEXT,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, hostname, software_name)
);

-- Create software deployments table
CREATE TABLE public.software_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_version TEXT,
  deployment_type TEXT NOT NULL DEFAULT 'install', -- install, update, uninstall
  deployment_status TEXT NOT NULL DEFAULT 'pending', -- pending, downloading, installing, completed, failed
  deployment_log TEXT,
  progress_percentage INTEGER DEFAULT 0,
  started_by UUID,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create maintenance schedules table
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  schedule_name TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- patching, backup, scan, reboot, cleanup
  target_filter JSONB NOT NULL DEFAULT '{}', -- criteria for which devices to target
  schedule_cron TEXT NOT NULL, -- cron expression
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance executions table
CREATE TABLE public.maintenance_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  devices_targeted INTEGER DEFAULT 0,
  devices_completed INTEGER DEFAULT 0,
  devices_failed INTEGER DEFAULT 0,
  execution_log JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create network discovery table
CREATE TABLE public.network_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  scan_range TEXT NOT NULL, -- IP range scanned
  discovered_devices JSONB DEFAULT '[]',
  scan_type TEXT NOT NULL DEFAULT 'ping', -- ping, port_scan, snmp
  scan_status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  devices_found INTEGER DEFAULT 0,
  started_by UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  scan_duration_ms INTEGER
);

-- Create device groups table for organization
CREATE TABLE public.device_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  group_type TEXT NOT NULL DEFAULT 'custom', -- location, department, device_type, custom
  description TEXT,
  criteria JSONB DEFAULT '{}', -- filtering criteria
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, group_name)
);

-- Create device group memberships table
CREATE TABLE public.device_group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, client_id, hostname)
);

-- Create remote sessions table for tracking remote access
CREATE TABLE public.remote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  session_type TEXT NOT NULL, -- rdp, vnc, ssh, web_terminal
  session_status TEXT NOT NULL DEFAULT 'active', -- active, disconnected, failed
  started_by UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  connection_info JSONB DEFAULT '{}',
  session_log TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.rmm_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MSP access
CREATE POLICY "MSPs can manage their client RMM endpoints" ON public.rmm_endpoints
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client RMM metrics" ON public.rmm_metrics
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client RMM alerts" ON public.rmm_alerts
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client RMM commands" ON public.rmm_command_logs
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client software inventory" ON public.software_inventory
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client software deployments" ON public.software_deployments
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client maintenance schedules" ON public.maintenance_schedules
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client maintenance executions" ON public.maintenance_executions
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client network discoveries" ON public.network_discoveries
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client device groups" ON public.device_groups
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client device group memberships" ON public.device_group_memberships
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

CREATE POLICY "MSPs can manage their client remote sessions" ON public.remote_sessions
FOR ALL USING (
  client_id IN (
    SELECT msp_clients.id FROM msp_clients 
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
  OR client_id = 'self' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'business'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_rmm_endpoints_client_status ON rmm_endpoints(client_id, status);
CREATE INDEX idx_rmm_endpoints_last_seen ON rmm_endpoints(last_seen);
CREATE INDEX idx_rmm_metrics_client_hostname ON rmm_metrics(client_id, hostname);
CREATE INDEX idx_rmm_metrics_collected_at ON rmm_metrics(collected_at);
CREATE INDEX idx_rmm_alerts_client_status ON rmm_alerts(client_id, status);
CREATE INDEX idx_rmm_alerts_severity ON rmm_alerts(severity);
CREATE INDEX idx_rmm_command_logs_client_hostname ON rmm_command_logs(client_id, hostname);
CREATE INDEX idx_software_inventory_client_hostname ON software_inventory(client_id, hostname);
CREATE INDEX idx_maintenance_schedules_next_run ON maintenance_schedules(next_run_at) WHERE is_active = true;

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_rmm_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rmm_endpoints_updated_at
  BEFORE UPDATE ON rmm_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_rmm_updated_at_column();

CREATE TRIGGER update_rmm_alerts_updated_at
  BEFORE UPDATE ON rmm_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_rmm_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_rmm_updated_at_column();

CREATE TRIGGER update_device_groups_updated_at
  BEFORE UPDATE ON device_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_rmm_updated_at_column();

-- Enable realtime for real-time monitoring
ALTER TABLE rmm_endpoints REPLICA IDENTITY FULL;
ALTER TABLE rmm_metrics REPLICA IDENTITY FULL;
ALTER TABLE rmm_alerts REPLICA IDENTITY FULL;
ALTER TABLE rmm_command_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rmm_endpoints;
ALTER PUBLICATION supabase_realtime ADD TABLE rmm_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE rmm_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE rmm_command_logs;