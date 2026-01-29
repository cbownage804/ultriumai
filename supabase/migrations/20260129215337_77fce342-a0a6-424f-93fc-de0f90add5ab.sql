-- Create table for fleet configuration policies
CREATE TABLE public.vanguard_config_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  assigned_devices INTEGER DEFAULT 0,
  assigned_groups TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for runbook automation
CREATE TABLE public.vanguard_runbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  total_runs INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for runbook executions
CREATE TABLE public.vanguard_runbook_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  runbook_id UUID REFERENCES public.vanguard_runbooks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  triggered_by TEXT,
  target_devices TEXT[] DEFAULT '{}',
  current_step TEXT,
  step_results JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for license management
CREATE TABLE public.vanguard_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  software_name TEXT NOT NULL,
  vendor TEXT,
  license_type TEXT NOT NULL DEFAULT 'subscription',
  license_key TEXT,
  total_seats INTEGER DEFAULT 1,
  used_seats INTEGER DEFAULT 0,
  purchase_date DATE,
  expiration_date DATE,
  cost NUMERIC(10,2) DEFAULT 0,
  renewal_cost NUMERIC(10,2),
  auto_renew BOOLEAN DEFAULT false,
  assigned_to TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'other',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vanguard_config_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_runbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vanguard_config_policies
CREATE POLICY "Users can view own config policies" ON public.vanguard_config_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own config policies" ON public.vanguard_config_policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own config policies" ON public.vanguard_config_policies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own config policies" ON public.vanguard_config_policies FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vanguard_runbooks
CREATE POLICY "Users can view own runbooks" ON public.vanguard_runbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own runbooks" ON public.vanguard_runbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runbooks" ON public.vanguard_runbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own runbooks" ON public.vanguard_runbooks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vanguard_runbook_executions
CREATE POLICY "Users can view own runbook executions" ON public.vanguard_runbook_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own runbook executions" ON public.vanguard_runbook_executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runbook executions" ON public.vanguard_runbook_executions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own runbook executions" ON public.vanguard_runbook_executions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for vanguard_licenses
CREATE POLICY "Users can view own licenses" ON public.vanguard_licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own licenses" ON public.vanguard_licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own licenses" ON public.vanguard_licenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own licenses" ON public.vanguard_licenses FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vanguard_config_policies_user ON public.vanguard_config_policies(user_id);
CREATE INDEX idx_vanguard_runbooks_user ON public.vanguard_runbooks(user_id);
CREATE INDEX idx_vanguard_runbook_executions_user ON public.vanguard_runbook_executions(user_id);
CREATE INDEX idx_vanguard_runbook_executions_runbook ON public.vanguard_runbook_executions(runbook_id);
CREATE INDEX idx_vanguard_licenses_user ON public.vanguard_licenses(user_id);
CREATE INDEX idx_vanguard_licenses_expiration ON public.vanguard_licenses(expiration_date);