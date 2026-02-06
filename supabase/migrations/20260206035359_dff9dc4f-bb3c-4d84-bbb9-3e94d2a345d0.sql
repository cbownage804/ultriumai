
-- Client-level compliance tracking
CREATE TABLE IF NOT EXISTS public.client_compliance_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  framework_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  compliance_score NUMERIC DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  last_scan_job_id UUID REFERENCES public.compliance_scan_jobs(id),
  target_score NUMERIC DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, framework_type)
);

ALTER TABLE public.client_compliance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own client compliance profiles"
  ON public.client_compliance_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Link compliance scan jobs to clients
ALTER TABLE public.compliance_scan_jobs
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_scan_jobs_client ON public.compliance_scan_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_compliance_profiles_client ON public.client_compliance_profiles(client_id);

-- Compliance policies/requirements per client
CREATE TABLE IF NOT EXISTS public.client_compliance_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  framework_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'compliant', 'non_compliant', 'waived')),
  due_date DATE,
  evidence_url TEXT,
  evidence_notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_compliance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own client compliance policies"
  ON public.client_compliance_policies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_compliance_policies_client ON public.client_compliance_policies(client_id);
