-- Create tables needed for Vanguard Network Connector functionality

-- Network Connectors table
CREATE TABLE IF NOT EXISTS public.network_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Network Scan Jobs table
CREATE TABLE IF NOT EXISTS public.network_scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    connector_id UUID REFERENCES public.network_connectors(id) ON DELETE CASCADE,
    targets TEXT[] NOT NULL,
    scan_type TEXT NOT NULL,
    options JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    results_summary JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Analysis Results table  
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.network_scan_jobs(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    findings_count INTEGER DEFAULT 0,
    ai_analysis TEXT,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.network_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for network_connectors
CREATE POLICY "Users can manage their own network connectors"
ON public.network_connectors
FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for network_scan_jobs
CREATE POLICY "Users can manage their own scan jobs"
ON public.network_scan_jobs
FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for ai_analysis_results
CREATE POLICY "Users can view their own AI analysis results"
ON public.ai_analysis_results
FOR ALL
USING (user_id = auth.uid());

-- Add updated_at trigger for network_connectors
CREATE OR REPLACE FUNCTION public.update_network_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_network_connectors_updated_at
BEFORE UPDATE ON public.network_connectors
FOR EACH ROW
EXECUTE FUNCTION public.update_network_connectors_updated_at();