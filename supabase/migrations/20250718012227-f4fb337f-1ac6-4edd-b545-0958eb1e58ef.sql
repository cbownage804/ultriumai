-- Create safenet_connectors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.safenet_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL UNIQUE,
  connector_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  client_name TEXT,
  version TEXT,
  system_info JSONB DEFAULT '{}',
  network_info JSONB DEFAULT '{}',
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safenet_connectors ENABLE ROW LEVEL SECURITY;

-- Create policies for safenet_connectors
CREATE POLICY "Users can view their own connectors" 
ON public.safenet_connectors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage connectors" 
ON public.safenet_connectors 
FOR ALL 
USING (true);

-- Insert a default connector for the agent ID
INSERT INTO public.safenet_connectors (user_id, connector_key, connector_name, status)
SELECT 
  'da0ada0a-3213-43ec-bff0-d48810b312dd'::uuid,
  'sk-safenet-b8cfe427-yhij47',
  'SafeNet Connector',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.safenet_connectors 
  WHERE connector_key = 'sk-safenet-b8cfe427-yhij47'
);