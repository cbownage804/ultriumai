-- Create table for agentless scanning credentials
CREATE TABLE public.vanguard_agent_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_name TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('winrm', 'ssh_password', 'ssh_key', 'snmp_v2', 'snmp_v3')),
  -- Common fields
  username TEXT,
  -- Encrypted password/key (stored encrypted, decrypted in edge function)
  encrypted_password TEXT,
  encrypted_private_key TEXT,
  -- SNMP specific
  snmp_community TEXT,
  snmp_auth_protocol TEXT,
  snmp_priv_protocol TEXT,
  -- WinRM specific  
  domain TEXT,
  use_ssl BOOLEAN DEFAULT true,
  -- SSH specific
  port INTEGER DEFAULT 22,
  -- Target scope (which IPs/subnets this credential applies to)
  target_scope JSONB DEFAULT '[]'::jsonb,
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_test_result TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vanguard_agent_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own credentials" 
ON public.vanguard_agent_credentials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credentials" 
ON public.vanguard_agent_credentials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" 
ON public.vanguard_agent_credentials 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" 
ON public.vanguard_agent_credentials 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for agentless scan jobs
CREATE TABLE public.agentless_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('windows', 'linux', 'network', 'full')),
  target_hosts JSONB NOT NULL DEFAULT '[]'::jsonb,
  credential_ids JSONB DEFAULT '[]'::jsonb,
  framework_type TEXT,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_hosts INTEGER DEFAULT 0,
  scanned_hosts INTEGER DEFAULT 0,
  compliance_results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agentless_scan_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own agentless scans" 
ON public.agentless_scan_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agentless scans" 
ON public.agentless_scan_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agentless scans" 
ON public.agentless_scan_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for agentless check results
CREATE TABLE public.agentless_check_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.agentless_scan_jobs(id) ON DELETE CASCADE,
  target_host TEXT NOT NULL,
  check_id TEXT NOT NULL,
  check_name TEXT NOT NULL,
  check_description TEXT,
  category TEXT,
  framework_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'error', 'skipped')),
  severity TEXT DEFAULT 'medium',
  actual_value TEXT,
  expected_value TEXT,
  remediation_steps TEXT,
  evidence JSONB,
  cis_benchmark_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agentless_check_results ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own agentless results" 
ON public.agentless_check_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agentless results" 
ON public.agentless_check_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_agentless_scan_jobs_user_id ON public.agentless_scan_jobs(user_id);
CREATE INDEX idx_agentless_scan_jobs_status ON public.agentless_scan_jobs(scan_status);
CREATE INDEX idx_agentless_check_results_job_id ON public.agentless_check_results(job_id);
CREATE INDEX idx_vanguard_credentials_user_id ON public.vanguard_agent_credentials(user_id);

-- Updated at trigger
CREATE TRIGGER update_vanguard_credentials_updated_at
BEFORE UPDATE ON public.vanguard_agent_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agentless_scan_jobs_updated_at
BEFORE UPDATE ON public.agentless_scan_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();