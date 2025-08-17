-- Create security scans table
CREATE TABLE public.security_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target TEXT NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('vulnerability', 'penetration', 'compliance', 'full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  findings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security findings table
CREATE TABLE public.security_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.security_scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  recommendation TEXT,
  location TEXT,
  evidence TEXT[] DEFAULT '{}',
  cve TEXT,
  cvss DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;

-- Create policies for security_scans
CREATE POLICY "Users can view their own scans" 
ON public.security_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" 
ON public.security_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" 
ON public.security_scans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for security_findings
CREATE POLICY "Users can view their own findings" 
ON public.security_findings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own findings" 
ON public.security_findings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_security_scans_user_id ON public.security_scans(user_id);
CREATE INDEX idx_security_scans_status ON public.security_scans(status);
CREATE INDEX idx_security_scans_scan_type ON public.security_scans(scan_type);
CREATE INDEX idx_security_findings_scan_id ON public.security_findings(scan_id);
CREATE INDEX idx_security_findings_user_id ON public.security_findings(user_id);
CREATE INDEX idx_security_findings_severity ON public.security_findings(severity);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_security_scans_updated_at
  BEFORE UPDATE ON public.security_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();