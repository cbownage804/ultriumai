-- Pentest Organizations table
CREATE TABLE IF NOT EXISTS public.pentest_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  industry TEXT,
  domain TEXT,
  internal_ips_allocated INTEGER DEFAULT 0,
  internal_ips_used INTEGER DEFAULT 0,
  external_ips_allocated INTEGER DEFAULT 0,
  external_ips_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pentest Assessments table
CREATE TABLE IF NOT EXISTS public.pentest_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.pentest_organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL, -- 'internal_network', 'external_network', 'web_application', 'wireless'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'failed', 'cancelled'
  scheduled_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  runtime_seconds INTEGER,
  ips_scanned INTEGER DEFAULT 0,
  scheduled_by TEXT,
  target_hosts JSONB DEFAULT '[]'::jsonb,
  scan_options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pentest Findings table (Vonahi-style)
CREATE TABLE IF NOT EXISTS public.pentest_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.pentest_assessments(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.pentest_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low', 'informational'
  cvss_score DECIMAL(3,1),
  cvss_vector TEXT,
  cve_ids TEXT[],
  cwe_id TEXT,
  affected_hosts JSONB DEFAULT '[]'::jsonb,
  affected_ports TEXT[],
  evidence TEXT,
  proof_of_concept TEXT,
  remediation TEXT,
  remediation_difficulty TEXT, -- 'easy', 'moderate', 'difficult'
  business_impact TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_false_positive BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'remediated', 'accepted_risk'
  first_found_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  remediated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pentest IP Management table
CREATE TABLE IF NOT EXISTS public.pentest_ip_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.pentest_organizations(id) ON DELETE CASCADE,
  ip_type TEXT NOT NULL, -- 'internal', 'external'
  cidr_range TEXT NOT NULL,
  description TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pentest_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pentest_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pentest_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pentest_ip_ranges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pentest_organizations
CREATE POLICY "Users can view own pentest organizations" ON public.pentest_organizations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pentest organizations" ON public.pentest_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pentest organizations" ON public.pentest_organizations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pentest organizations" ON public.pentest_organizations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pentest_assessments
CREATE POLICY "Users can view own pentest assessments" ON public.pentest_assessments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pentest assessments" ON public.pentest_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pentest assessments" ON public.pentest_assessments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pentest assessments" ON public.pentest_assessments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pentest_findings
CREATE POLICY "Users can view own pentest findings" ON public.pentest_findings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pentest findings" ON public.pentest_findings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pentest findings" ON public.pentest_findings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pentest findings" ON public.pentest_findings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pentest_ip_ranges
CREATE POLICY "Users can view own pentest ip ranges" ON public.pentest_ip_ranges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pentest ip ranges" ON public.pentest_ip_ranges
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pentest ip ranges" ON public.pentest_ip_ranges
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pentest ip ranges" ON public.pentest_ip_ranges
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_pentest_organizations_user ON public.pentest_organizations(user_id);
CREATE INDEX idx_pentest_assessments_user ON public.pentest_assessments(user_id);
CREATE INDEX idx_pentest_assessments_org ON public.pentest_assessments(organization_id);
CREATE INDEX idx_pentest_findings_user ON public.pentest_findings(user_id);
CREATE INDEX idx_pentest_findings_assessment ON public.pentest_findings(assessment_id);
CREATE INDEX idx_pentest_findings_severity ON public.pentest_findings(severity);
CREATE INDEX idx_pentest_ip_ranges_org ON public.pentest_ip_ranges(organization_id);