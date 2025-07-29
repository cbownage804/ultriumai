-- Patch Management Tables
CREATE TABLE IF NOT EXISTS public.software_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patch_name TEXT NOT NULL,
  patch_version TEXT,
  vendor TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  patch_type TEXT NOT NULL CHECK (patch_type IN ('security', 'feature', 'bugfix', 'driver', 'firmware')),
  description TEXT,
  cve_ids TEXT[],
  kb_article TEXT,
  release_date DATE,
  deployment_status TEXT NOT NULL DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'scheduled', 'installing', 'completed', 'failed', 'cancelled')),
  deployment_strategy TEXT DEFAULT 'staged' CHECK (deployment_strategy IN ('immediate', 'staged', 'manual')),
  target_devices JSONB DEFAULT '[]',
  installed_devices JSONB DEFAULT '[]',
  failed_devices JSONB DEFAULT '[]',
  ai_risk_score DECIMAL(3,2),
  ai_priority TEXT CHECK (ai_priority IN ('immediate', 'high', 'medium', 'low')),
  ai_recommendation TEXT,
  rollback_plan TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patch_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('automatic', 'maintenance_window', 'manual')),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  maintenance_window_start TIME,
  maintenance_window_end TIME,
  maintenance_days INTEGER[], -- 0=Sunday, 1=Monday, etc.
  max_concurrent_installs INTEGER DEFAULT 5,
  auto_approve_critical BOOLEAN DEFAULT false,
  auto_approve_security BOOLEAN DEFAULT false,
  test_group_devices JSONB DEFAULT '[]',
  rollback_threshold_percent INTEGER DEFAULT 20,
  notification_settings JSONB DEFAULT '{"email": true, "in_app": true}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patch_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deployment_id UUID REFERENCES public.software_deployments(id) ON DELETE CASCADE NOT NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patch_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  os_type TEXT NOT NULL,
  os_version TEXT,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  missing_patches_count INTEGER DEFAULT 0,
  critical_patches_count INTEGER DEFAULT 0,
  security_patches_count INTEGER DEFAULT 0,
  compliance_score DECIMAL(5,2) DEFAULT 0,
  compliance_status TEXT DEFAULT 'unknown' CHECK (compliance_status IN ('compliant', 'non_compliant', 'partially_compliant', 'unknown')),
  last_patched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patch_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('compliance', 'deployment', 'vulnerability', 'summary')),
  report_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_period_start DATE,
  report_period_end DATE,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.software_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patch_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patch_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patch_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patch_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own deployments" ON public.software_deployments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own patch schedules" ON public.patch_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage approvals for their deployments" ON public.patch_approvals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.software_deployments WHERE id = patch_approvals.deployment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own compliance data" ON public.patch_compliance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reports" ON public.patch_reports FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_software_deployments_user_id ON public.software_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_software_deployments_status ON public.software_deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_software_deployments_severity ON public.software_deployments(severity);
CREATE INDEX IF NOT EXISTS idx_patch_schedules_user_id ON public.patch_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_patch_approvals_deployment_id ON public.patch_approvals(deployment_id);
CREATE INDEX IF NOT EXISTS idx_patch_compliance_user_id ON public.patch_compliance(user_id);
CREATE INDEX IF NOT EXISTS idx_patch_compliance_hostname ON public.patch_compliance(hostname);
CREATE INDEX IF NOT EXISTS idx_patch_reports_user_id ON public.patch_reports(user_id);

-- Triggers
CREATE TRIGGER update_software_deployments_updated_at BEFORE UPDATE ON public.software_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patch_schedules_updated_at BEFORE UPDATE ON public.patch_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patch_compliance_updated_at BEFORE UPDATE ON public.patch_compliance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();