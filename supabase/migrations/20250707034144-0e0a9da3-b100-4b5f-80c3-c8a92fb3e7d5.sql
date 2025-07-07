-- Create remote sessions table
CREATE TABLE public.remote_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'desktop',
  session_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'connecting',
  client_ip TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clipboard syncs table
CREATE TABLE public.clipboard_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  remote_session_id UUID,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  direction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.remote_sessions
ADD CONSTRAINT fk_remote_sessions_device_id 
FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.remote_commands
ADD CONSTRAINT fk_remote_commands_device_id 
FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.remote_commands
ADD CONSTRAINT fk_remote_commands_session_id 
FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.file_transfers
ADD CONSTRAINT fk_file_transfers_device_id 
FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.file_transfers
ADD CONSTRAINT fk_file_transfers_session_id 
FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.script_executions
ADD CONSTRAINT fk_script_executions_device_id 
FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.script_executions
ADD CONSTRAINT fk_script_executions_session_id 
FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.clipboard_syncs
ADD CONSTRAINT fk_clipboard_syncs_device_id 
FOREIGN KEY (device_id) REFERENCES public.rmm_devices(id) ON DELETE CASCADE;

ALTER TABLE public.clipboard_syncs
ADD CONSTRAINT fk_clipboard_syncs_session_id 
FOREIGN KEY (remote_session_id) REFERENCES public.remote_sessions(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clipboard_syncs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for remote_sessions
CREATE POLICY "Users can manage their own remote sessions" 
ON public.remote_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for remote_commands
CREATE POLICY "Users can manage their own remote commands" 
ON public.remote_commands 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for file_transfers
CREATE POLICY "Users can manage their own file transfers" 
ON public.file_transfers 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for script_executions
CREATE POLICY "Users can manage their own script executions" 
ON public.script_executions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for clipboard_syncs
CREATE POLICY "Users can manage their own clipboard syncs" 
ON public.clipboard_syncs 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_remote_sessions_user_id ON public.remote_sessions(user_id);
CREATE INDEX idx_remote_sessions_device_id ON public.remote_sessions(device_id);
CREATE INDEX idx_remote_sessions_status ON public.remote_sessions(status);
CREATE INDEX idx_remote_sessions_token ON public.remote_sessions(session_token);

CREATE INDEX idx_remote_commands_user_id ON public.remote_commands(user_id);
CREATE INDEX idx_remote_commands_device_id ON public.remote_commands(device_id);
CREATE INDEX idx_remote_commands_session_id ON public.remote_commands(remote_session_id);

CREATE INDEX idx_file_transfers_user_id ON public.file_transfers(user_id);
CREATE INDEX idx_file_transfers_device_id ON public.file_transfers(device_id);
CREATE INDEX idx_file_transfers_session_id ON public.file_transfers(remote_session_id);

CREATE INDEX idx_script_executions_user_id ON public.script_executions(user_id);
CREATE INDEX idx_script_executions_device_id ON public.script_executions(device_id);
CREATE INDEX idx_script_executions_session_id ON public.script_executions(remote_session_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_remote_sessions_updated_at
BEFORE UPDATE ON public.remote_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remote_commands_updated_at
BEFORE UPDATE ON public.remote_commands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_transfers_updated_at
BEFORE UPDATE ON public.file_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_script_executions_updated_at
BEFORE UPDATE ON public.script_executions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();