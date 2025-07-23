-- Create device_commands table as specified in the requirements
CREATE TABLE public.device_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  command_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint to safenet_devices (using existing table)
ALTER TABLE public.device_commands 
ADD CONSTRAINT fk_device_commands_device_id 
FOREIGN KEY (device_id) REFERENCES public.safenet_devices(id) ON DELETE CASCADE;

-- Add status constraint
ALTER TABLE public.device_commands 
ADD CONSTRAINT check_command_status 
CHECK (status IN ('queued', 'in_progress', 'done', 'failed'));

-- Add command_type constraint  
ALTER TABLE public.device_commands 
ADD CONSTRAINT check_command_type 
CHECK (command_type IN ('run_scan', 'checkin_now', 'restart_service', 'custom_script', 'update_config'));

-- Enable RLS
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service can manage device commands" 
ON public.device_commands 
FOR ALL 
USING (true);

CREATE POLICY "Users can view commands for their devices" 
ON public.device_commands 
FOR SELECT 
USING (
  device_id IN (
    SELECT id FROM public.safenet_devices 
    WHERE user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_device_commands_device_id ON public.device_commands(device_id);
CREATE INDEX idx_device_commands_status ON public.device_commands(status);
CREATE INDEX idx_device_commands_created_at ON public.device_commands(created_at);