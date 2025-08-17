-- Create tables for hybrid network penetration testing

-- Network connectors (internal agents)
CREATE TABLE public.network_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  network_ranges TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'offline',
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  version TEXT,
  os_info JSONB DEFAULT '{}',
  tools_available TEXT[] DEFAULT '{}',
  system_metrics JSONB DEFAULT '{}',
  active_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Network scan jobs
CREATE TABLE public.network_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID NOT NULL REFERENCES public.network_connectors(id) ON DELETE CASCADE,
  targets TEXT[] NOT NULL,
  scan_type TEXT NOT NULL,
  options JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  results_summary JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Network findings from internal scans
CREATE TABLE public.network_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.network_scan_jobs(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.network_connectors(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target TEXT NOT NULL,
  port INTEGER,
  service TEXT,
  impact TEXT,
  recommendation TEXT,
  evidence JSONB DEFAULT '[]',
  cve TEXT,
  cvss NUMERIC,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI analysis results for network findings
CREATE TABLE public.ai_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.network_scan_jobs(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  findings_count INTEGER DEFAULT 0,
  ai_analysis TEXT,
  risk_score INTEGER DEFAULT 0,
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own network connectors"
ON public.network_connectors
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own network scan jobs"
ON public.network_scan_jobs
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own network findings"
ON public.network_findings
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own AI analysis"
ON public.ai_analysis_results
FOR ALL
USING (user_id = auth.uid());

-- System policies for connectors to report
CREATE POLICY "System can update connector status"
ON public.network_connectors
FOR UPDATE
USING (true);

CREATE POLICY "System can insert scan results"
ON public.network_findings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update scan jobs"
ON public.network_scan_jobs
FOR UPDATE
USING (true);

-- Indexes for performance
CREATE INDEX idx_network_connectors_user_id ON public.network_connectors(user_id);
CREATE INDEX idx_network_connectors_status ON public.network_connectors(status);
CREATE INDEX idx_network_scan_jobs_user_id ON public.network_scan_jobs(user_id);
CREATE INDEX idx_network_scan_jobs_connector_id ON public.network_scan_jobs(connector_id);
CREATE INDEX idx_network_scan_jobs_status ON public.network_scan_jobs(status);
CREATE INDEX idx_network_findings_user_id ON public.network_findings(user_id);
CREATE INDEX idx_network_findings_job_id ON public.network_findings(job_id);
CREATE INDEX idx_network_findings_severity ON public.network_findings(severity);

-- Triggers for updated_at
CREATE TRIGGER update_network_connectors_updated_at
  BEFORE UPDATE ON public.network_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_network_scan_jobs_updated_at
  BEFORE UPDATE ON public.network_scan_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();