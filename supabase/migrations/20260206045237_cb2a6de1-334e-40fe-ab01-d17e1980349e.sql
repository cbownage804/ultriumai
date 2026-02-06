
-- Evidence Vault: file uploads attached to compliance policies
CREATE TABLE public.compliance_evidence_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  policy_id UUID,
  framework_type TEXT NOT NULL,
  evidence_name TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'document',
  file_url TEXT,
  file_size_bytes BIGINT,
  description TEXT,
  uploaded_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_evidence_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own evidence" ON public.compliance_evidence_vault
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vendor Risk Management
CREATE TABLE public.compliance_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  vendor_name TEXT NOT NULL,
  vendor_category TEXT,
  contact_email TEXT,
  contact_name TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  compliance_status TEXT NOT NULL DEFAULT 'not_assessed',
  data_access_level TEXT DEFAULT 'none',
  frameworks TEXT[] DEFAULT '{}',
  soc2_report_url TEXT,
  last_assessment_date TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,
  contract_expiry TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vendors" ON public.compliance_vendors
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Employee Training Tracker
CREATE TABLE public.compliance_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  employee_name TEXT NOT NULL,
  employee_email TEXT,
  department TEXT,
  training_name TEXT NOT NULL,
  training_type TEXT NOT NULL DEFAULT 'security_awareness',
  framework_type TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  assigned_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  score NUMERIC,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own training" ON public.compliance_training
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
