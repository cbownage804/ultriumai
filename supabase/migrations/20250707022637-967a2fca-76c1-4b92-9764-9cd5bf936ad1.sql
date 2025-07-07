-- Create remote access sessions table
CREATE TABLE public.remote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'desktop', -- desktop, terminal, file_transfer
  status TEXT NOT NULL DEFAULT 'connecting', -- connecting, active, disconnected, ended
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  client_ip TEXT,
  session_token TEXT NOT NULL,
  connection_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create script executions table
CREATE TABLE public.script_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  script_name TEXT NOT NULL,
  script_content TEXT NOT NULL,
  script_type TEXT NOT NULL DEFAULT 'powershell', -- powershell, cmd, bash
  execution_status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  exit_code INTEGER,
  output TEXT,
  error_output TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file transfers table
CREATE TABLE public.file_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  transfer_type TEXT NOT NULL, -- upload, download
  local_path TEXT NOT NULL,
  remote_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  transfer_status TEXT NOT NULL DEFAULT 'pending', -- pending, transferring, completed, failed
  bytes_transferred BIGINT DEFAULT 0,
  transfer_speed BIGINT, -- bytes per second
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
  content_type TEXT NOT NULL DEFAULT 'text', -- text, image, file
  direction TEXT NOT NULL, -- to_remote, from_remote
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remote commands table
CREATE TABLE public.remote_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  command TEXT NOT NULL,
  command_type TEXT NOT NULL DEFAULT 'cmd', -- cmd, powershell, registry, service
  status TEXT NOT NULL DEFAULT 'pending', -- pending, executing, completed, failed
  output TEXT,
  error_output TEXT,
  exit_code INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipboard_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_commands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own remote sessions" ON public.remote_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own script executions" ON public.script_executions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own file transfers" ON public.file_transfers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own clipboard syncs" ON public.clipboard_syncs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own remote commands" ON public.remote_commands FOR ALL USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_remote_sessions_updated_at BEFORE UPDATE ON public.remote_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_script_executions_updated_at BEFORE UPDATE ON public.script_executions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_file_transfers_updated_at BEFORE UPDATE ON public.file_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.remote_sessions ADD CONSTRAINT fk_remote_sessions_device FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;
ALTER TABLE public.script_executions ADD CONSTRAINT fk_script_executions_device FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;
ALTER TABLE public.script_executions ADD CONSTRAINT fk_script_executions_session FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.file_transfers ADD CONSTRAINT fk_file_transfers_device FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;
ALTER TABLE public.file_transfers ADD CONSTRAINT fk_file_transfers_session FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.clipboard_syncs ADD CONSTRAINT fk_clipboard_syncs_device FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;
ALTER TABLE public.clipboard_syncs ADD CONSTRAINT fk_clipboard_syncs_session FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE CASCADE;
ALTER TABLE public.remote_commands ADD CONSTRAINT fk_remote_commands_device FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;
ALTER TABLE public.remote_commands ADD CONSTRAINT fk_remote_commands_session FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;