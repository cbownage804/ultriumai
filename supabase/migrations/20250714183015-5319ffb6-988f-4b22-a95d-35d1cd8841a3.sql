-- Create table for SafeNet Connector registrations
CREATE TABLE IF NOT EXISTS public.safenet_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_key TEXT NOT NULL UNIQUE,
  connector_name TEXT NOT NULL,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  version TEXT,
  system_info JSONB DEFAULT '{}',
  network_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safenet_connectors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own connectors" 
ON public.safenet_connectors FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own connectors" 
ON public.safenet_connectors FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own connectors" 
ON public.safenet_connectors FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can update connector status" 
ON public.safenet_connectors FOR UPDATE 
USING (true);

-- Add foreign key reference to network_scans if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'network_scans') THEN
    ALTER TABLE public.network_scans 
    ADD COLUMN IF NOT EXISTS connector_id UUID REFERENCES public.safenet_connectors(id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_user_id ON public.safenet_connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_key ON public.safenet_connectors(connector_key);
CREATE INDEX IF NOT EXISTS idx_safenet_connectors_status ON public.safenet_connectors(status);

-- Create function to validate connector authentication
CREATE OR REPLACE FUNCTION public.validate_connector_key(p_connector_key TEXT)
RETURNS TABLE(connector_id UUID, user_id UUID, is_valid BOOLEAN)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sc.id as connector_id,
    sc.user_id,
    true as is_valid
  FROM public.safenet_connectors sc
  WHERE sc.connector_key = p_connector_key
  AND sc.status = 'active';
$$;