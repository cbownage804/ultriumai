-- Create network_scans table for SafeNet scan data
CREATE TABLE public.network_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID NOT NULL,
  scan_type TEXT NOT NULL,
  network_ranges TEXT[] NOT NULL,
  devices_found INTEGER NOT NULL DEFAULT 0,
  scan_duration INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hostname TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own network scans" 
ON public.network_scans 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own network scans" 
ON public.network_scans 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_network_scans_updated_at
BEFORE UPDATE ON public.network_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();