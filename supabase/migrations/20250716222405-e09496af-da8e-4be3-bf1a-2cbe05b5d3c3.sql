-- Create table for SafeNet scan results
CREATE TABLE IF NOT EXISTS public.safenet_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID NOT NULL REFERENCES public.safenet_connectors(id),
  scan_data JSONB NOT NULL DEFAULT '{}',
  devices_found INTEGER DEFAULT 0,
  networks_scanned INTEGER DEFAULT 0,
  total_ports INTEGER DEFAULT 0,
  scan_duration INTEGER DEFAULT 0,
  system_info JSONB DEFAULT '{}',
  vulnerabilities JSONB DEFAULT '[]',
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safenet_scans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scan results" 
ON public.safenet_scans FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own scan results" 
ON public.safenet_scans FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert scan results" 
ON public.safenet_scans FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_safenet_scans_user_id ON public.safenet_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_safenet_scans_connector_id ON public.safenet_scans(connector_id);
CREATE INDEX IF NOT EXISTS idx_safenet_scans_created_at ON public.safenet_scans(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_safenet_scans_updated_at
BEFORE UPDATE ON public.safenet_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();