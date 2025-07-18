-- Create network_scans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.network_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID,
  scan_type TEXT NOT NULL,
  network_ranges TEXT[] NOT NULL,
  devices_found INTEGER NOT NULL DEFAULT 0,
  scan_duration INTEGER,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hostname TEXT,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.network_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own network scans" 
ON public.network_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own network scans" 
ON public.network_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network scans" 
ON public.network_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network scans" 
ON public.network_scans 
FOR DELETE 
USING (auth.uid() = user_id);