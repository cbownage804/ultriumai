-- Create rmm_patches table for patch management
CREATE TABLE IF NOT EXISTS public.rmm_patches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.rmm_devices(id) ON DELETE SET NULL,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  kb_article TEXT,
  category TEXT NOT NULL DEFAULT 'security',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  size_bytes BIGINT,
  release_date TIMESTAMPTZ,
  installed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  reboot_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rmm_patches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all patches" ON public.rmm_patches
  FOR SELECT USING (true);
CREATE POLICY "Users can manage patches" ON public.rmm_patches
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_rmm_patches_status ON public.rmm_patches(status);
CREATE INDEX IF NOT EXISTS idx_rmm_patches_severity ON public.rmm_patches(severity);

-- Create rmm_policies table for policy management
CREATE TABLE IF NOT EXISTS public.rmm_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL DEFAULT 'compliance',
  category TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  compliance_score INTEGER NOT NULL DEFAULT 100,
  target_device_types TEXT[] NOT NULL DEFAULT ARRAY['workstation'],
  assigned_device_count INTEGER NOT NULL DEFAULT 0,
  last_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rmm_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all policies" ON public.rmm_policies
  FOR SELECT USING (true);
CREATE POLICY "Users can manage policies" ON public.rmm_policies
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_rmm_policies_active ON public.rmm_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_rmm_policies_type ON public.rmm_policies(policy_type);