-- Create RMM Agents table
CREATE TABLE public.rmm_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  ip_address INET,
  mac_address TEXT,
  operating_system TEXT NOT NULL,
  os_version TEXT,
  agent_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'updating', 'error')),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cpu_cores INTEGER,
  total_memory_gb INTEGER,
  total_disk_gb INTEGER,
  domain_joined BOOLEAN DEFAULT false,
  agent_capabilities JSONB DEFAULT '{"remote_shell": true, "file_operations": true, "process_management": true, "registry_access": true, "service_management": true}'::jsonb,
  configuration JSONB DEFAULT '{}'::jsonb,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM Agent Commands table for remote execution
CREATE TABLE public.rmm_agent_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.rmm_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  command_type TEXT NOT NULL CHECK (command_type IN ('powershell', 'cmd', 'file_operation', 'registry', 'service', 'process', 'system_info')),
  command_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'timeout')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  timeout_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  output TEXT,
  error_message TEXT,
  exit_code INTEGER
);

-- Create RMM Scripts table
CREATE TABLE public.rmm_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT NOT NULL CHECK (script_type IN ('powershell', 'batch', 'python', 'bash')),
  script_content TEXT NOT NULL,
  parameters JSONB DEFAULT '[]'::jsonb,
  is_template BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'custom',
  tags TEXT[] DEFAULT '{}',
  execution_timeout INTEGER DEFAULT 300,
  requires_elevation BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM Script Executions table
CREATE TABLE public.rmm_script_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.rmm_scripts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.rmm_agents(id) ON DELETE CASCADE,
  command_id UUID REFERENCES public.rmm_agent_commands(id),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'timeout')),
  parameters JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  output TEXT,
  error_message TEXT,
  exit_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM Agent System Info table
CREATE TABLE public.rmm_agent_system_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.rmm_agents(id) ON DELETE CASCADE,
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_percent DECIMAL(5,2),
  disk_usage_percent DECIMAL(5,2),
  uptime_seconds BIGINT,
  last_boot_time TIMESTAMP WITH TIME ZONE,
  logged_in_users JSONB DEFAULT '[]'::jsonb,
  running_processes INTEGER,
  installed_software JSONB DEFAULT '[]'::jsonb,
  system_services JSONB DEFAULT '[]'::jsonb,
  network_interfaces JSONB DEFAULT '[]'::jsonb,
  security_patches JSONB DEFAULT '[]'::jsonb,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_rmm_agents_client_id ON public.rmm_agents(client_id);
CREATE INDEX idx_rmm_agents_status ON public.rmm_agents(status);
CREATE INDEX idx_rmm_agents_last_seen ON public.rmm_agents(last_seen_at);
CREATE INDEX idx_rmm_agent_commands_agent_status ON public.rmm_agent_commands(agent_id, status);
CREATE INDEX idx_rmm_agent_commands_created ON public.rmm_agent_commands(created_at);
CREATE INDEX idx_rmm_script_executions_agent_id ON public.rmm_script_executions(agent_id);
CREATE INDEX idx_rmm_agent_system_info_agent_collected ON public.rmm_agent_system_info(agent_id, collected_at);

-- Enable RLS
ALTER TABLE public.rmm_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_agent_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_agent_system_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rmm_agents
CREATE POLICY "MSPs can view their client agents" 
ON public.rmm_agents 
FOR SELECT 
USING (client_id IN (
  SELECT msp_clients.id FROM msp_clients
  WHERE msp_clients.msp_id IN (
    SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
  )
));

CREATE POLICY "MSPs can manage their client agents" 
ON public.rmm_agents 
FOR ALL 
USING (client_id IN (
  SELECT msp_clients.id FROM msp_clients
  WHERE msp_clients.msp_id IN (
    SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
  )
));

-- Create RLS policies for rmm_agent_commands
CREATE POLICY "Users can manage commands for their agents" 
ON public.rmm_agent_commands 
FOR ALL 
USING (agent_id IN (
  SELECT rmm_agents.id FROM rmm_agents
  WHERE rmm_agents.client_id IN (
    SELECT msp_clients.id FROM msp_clients
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
));

-- Create RLS policies for rmm_scripts
CREATE POLICY "Users can manage their own scripts" 
ON public.rmm_scripts 
FOR ALL 
USING (user_id = auth.uid());

-- Create RLS policies for rmm_script_executions
CREATE POLICY "Users can view executions for their scripts and agents" 
ON public.rmm_script_executions 
FOR ALL 
USING (user_id = auth.uid() OR agent_id IN (
  SELECT rmm_agents.id FROM rmm_agents
  WHERE rmm_agents.client_id IN (
    SELECT msp_clients.id FROM msp_clients
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
));

-- Create RLS policies for rmm_agent_system_info
CREATE POLICY "MSPs can view system info for their client agents" 
ON public.rmm_agent_system_info 
FOR SELECT 
USING (agent_id IN (
  SELECT rmm_agents.id FROM rmm_agents
  WHERE rmm_agents.client_id IN (
    SELECT msp_clients.id FROM msp_clients
    WHERE msp_clients.msp_id IN (
      SELECT msps.id FROM msps WHERE msps.user_id = auth.uid()
    )
  )
));

-- System can insert system info
CREATE POLICY "System can insert agent system info" 
ON public.rmm_agent_system_info 
FOR INSERT 
WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_rmm_agents_updated_at
  BEFORE UPDATE ON public.rmm_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rmm_scripts_updated_at
  BEFORE UPDATE ON public.rmm_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();