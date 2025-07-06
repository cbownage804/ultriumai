-- Create SafeDoc document scans table
CREATE TABLE public.safedoc_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID REFERENCES public.msps(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'completed', 'failed')),
  threat_level TEXT DEFAULT 'unknown' CHECK (threat_level IN ('clean', 'low', 'medium', 'high', 'critical', 'unknown')),
  threats_found INTEGER DEFAULT 0,
  scan_results JSONB DEFAULT '{}',
  scan_engine TEXT DEFAULT 'virustotal',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Create SafeDoc scan results table for detailed findings
CREATE TABLE public.safedoc_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.safedoc_scans(id) ON DELETE CASCADE,
  engine_name TEXT NOT NULL,
  threat_name TEXT,
  threat_type TEXT,
  severity TEXT CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  description TEXT,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safedoc_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_scan_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SafeDoc scans
CREATE POLICY "MSPs can view their client scans" 
ON public.safedoc_scans 
FOR SELECT 
USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

CREATE POLICY "System can insert scans" 
ON public.safedoc_scans 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update scans" 
ON public.safedoc_scans 
FOR UPDATE 
USING (true);

-- RLS Policies for SafeDoc scan results
CREATE POLICY "MSPs can view their scan results" 
ON public.safedoc_scan_results 
FOR SELECT 
USING (scan_id IN (
  SELECT id FROM public.safedoc_scans 
  WHERE msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
));

CREATE POLICY "System can manage scan results" 
ON public.safedoc_scan_results 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_safedoc_scans_msp_id ON public.safedoc_scans(msp_id);
CREATE INDEX idx_safedoc_scans_client_id ON public.safedoc_scans(client_id);
CREATE INDEX idx_safedoc_scans_created_at ON public.safedoc_scans(created_at);
CREATE INDEX idx_safedoc_scans_threat_level ON public.safedoc_scans(threat_level);
CREATE INDEX idx_safedoc_scan_results_scan_id ON public.safedoc_scan_results(scan_id);

-- Add SafeDoc app subscriptions
ALTER TABLE public.security_app_subscriptions 
ADD COLUMN IF NOT EXISTS safedoc_enabled BOOLEAN DEFAULT false;