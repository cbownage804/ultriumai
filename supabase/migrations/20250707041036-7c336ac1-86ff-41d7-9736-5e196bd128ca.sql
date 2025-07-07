-- Create RMM devices table
CREATE TABLE public.rmm_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  ip_address TEXT,
  device_type TEXT,
  os_info TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  agent_version TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remote sessions table
CREATE TABLE public.remote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  session_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connecting',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  session_token TEXT NOT NULL,
  client_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remote commands table
CREATE TABLE public.remote_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  command TEXT NOT NULL,
  command_type TEXT NOT NULL DEFAULT 'cmd',
  status TEXT NOT NULL DEFAULT 'pending',
  output TEXT,
  error_output TEXT,
  exit_code INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create script executions table
CREATE TABLE public.script_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  script_name TEXT NOT NULL,
  script_content TEXT NOT NULL,
  script_type TEXT NOT NULL DEFAULT 'powershell',
  execution_status TEXT NOT NULL DEFAULT 'pending',
  output TEXT,
  error_output TEXT,
  exit_code INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file transfers table
CREATE TABLE public.file_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  transfer_type TEXT NOT NULL,
  local_path TEXT NOT NULL,
  remote_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  transfer_status TEXT NOT NULL DEFAULT 'pending',
  bytes_transferred BIGINT DEFAULT 0,
  transfer_speed BIGINT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clipboard syncs table
CREATE TABLE public.clipboard_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  direction TEXT NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rmm_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipboard_syncs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rmm_devices
CREATE POLICY "Users can manage their own RMM devices" ON public.rmm_devices
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for remote_sessions  
CREATE POLICY "Users can manage their own remote sessions" ON public.remote_sessions
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for remote_commands
CREATE POLICY "Users can manage their own remote commands" ON public.remote_commands
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for script_executions
CREATE POLICY "Users can manage their own script executions" ON public.script_executions
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for file_transfers
CREATE POLICY "Users can manage their own file transfers" ON public.file_transfers
  FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for clipboard_syncs
CREATE POLICY "Users can manage their own clipboard syncs" ON public.clipboard_syncs
  FOR ALL USING (user_id = auth.uid());

-- Create foreign key constraints
ALTER TABLE public.remote_sessions 
  ADD CONSTRAINT fk_remote_sessions_device 
  FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.remote_commands 
  ADD CONSTRAINT fk_remote_commands_device 
  FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.remote_commands 
  ADD CONSTRAINT fk_remote_commands_session 
  FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.script_executions 
  ADD CONSTRAINT fk_script_executions_device 
  FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.script_executions 
  ADD CONSTRAINT fk_script_executions_session 
  FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.file_transfers 
  ADD CONSTRAINT fk_file_transfers_device 
  FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.file_transfers 
  ADD CONSTRAINT fk_file_transfers_session 
  FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.clipboard_syncs 
  ADD CONSTRAINT fk_clipboard_syncs_device 
  FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.clipboard_syncs 
  ADD CONSTRAINT fk_clipboard_syncs_session 
  FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE CASCADE;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_rmm_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rmm_devices_updated_at
  BEFORE UPDATE ON public.rmm_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rmm_updated_at_column();

CREATE TRIGGER update_remote_sessions_updated_at
  BEFORE UPDATE ON public.remote_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rmm_updated_at_column();

CREATE TRIGGER update_file_transfers_updated_at
  BEFORE UPDATE ON public.file_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rmm_updated_at_column();

-- Insert some sample RMM devices for testing
INSERT INTO public.rmm_devices (user_id, hostname, ip_address, device_type, os_info, status, agent_version) VALUES
  (auth.uid(), 'DESKTOP-TEST01', '192.168.1.100', 'workstation', 'Windows 11 Pro', 'online', '1.0.0'),
  (auth.uid(), 'SERVER-DC01', '192.168.1.10', 'server', 'Windows Server 2022', 'online', '1.0.0'),
  (auth.uid(), 'LAPTOP-USER02', '192.168.1.150', 'workstation', 'Windows 10 Pro', 'offline', '1.0.0');