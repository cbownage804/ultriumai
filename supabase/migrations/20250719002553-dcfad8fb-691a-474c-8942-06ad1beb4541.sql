-- Create storage bucket for RMM agent installers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rmm-agents', 'rmm-agents', true);

-- Create policies for RMM agent downloads
CREATE POLICY "Anyone can download RMM agents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'rmm-agents');

CREATE POLICY "Authenticated users can upload RMM agents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'rmm-agents' AND auth.role() = 'authenticated');

-- Create table to track agent check-ins and status
CREATE TABLE public.rmm_agent_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID NOT NULL,
  agent_token TEXT NOT NULL,
  hostname TEXT NOT NULL,
  ip_address INET NOT NULL,
  agent_version TEXT,
  system_info JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  installed_software JSONB DEFAULT '[]',
  security_status JSONB DEFAULT '{}',
  last_checkin TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (device_id) REFERENCES safenet_devices(id) ON DELETE CASCADE
);

-- Enable RLS for agent check-ins
ALTER TABLE public.rmm_agent_checkins ENABLE ROW LEVEL SECURITY;

-- Create policy for agent check-ins
CREATE POLICY "Users can view their own agent check-ins" 
ON public.rmm_agent_checkins 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert agent check-ins" 
ON public.rmm_agent_checkins 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update agent check-ins" 
ON public.rmm_agent_checkins 
FOR UPDATE 
USING (true);