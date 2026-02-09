
-- Device Groups
CREATE TABLE IF NOT EXISTS public.vanguard_device_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  tags TEXT[] DEFAULT '{}',
  automation_profile TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_device_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own device groups" ON public.vanguard_device_groups FOR ALL USING (auth.uid() = user_id);

-- Device Group Members (which devices belong to which group)
CREATE TABLE IF NOT EXISTS public.vanguard_device_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.vanguard_device_groups(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, agent_id)
);

ALTER TABLE public.vanguard_device_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own device group members" ON public.vanguard_device_group_members FOR ALL USING (auth.uid() = user_id);

-- Maintenance Windows
CREATE TABLE IF NOT EXISTS public.vanguard_maintenance_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL DEFAULT '02:00',
  end_time TEXT NOT NULL DEFAULT '06:00',
  timezone TEXT DEFAULT 'UTC',
  recurrence TEXT NOT NULL DEFAULT 'weekly',
  days_of_week INTEGER[] DEFAULT '{0}',
  suppress_alerts BOOLEAN DEFAULT true,
  allow_patching BOOLEAN DEFAULT true,
  allow_reboots BOOLEAN DEFAULT true,
  device_groups TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  next_occurrence TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_maintenance_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own maintenance windows" ON public.vanguard_maintenance_windows FOR ALL USING (auth.uid() = user_id);

-- Policy Templates
CREATE TABLE IF NOT EXISTS public.vanguard_policy_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'security',
  is_active BOOLEAN DEFAULT false,
  assigned_devices INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_policy_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own policy templates" ON public.vanguard_policy_templates FOR ALL USING (auth.uid() = user_id);

-- Alert Threshold Profiles
CREATE TABLE IF NOT EXISTS public.vanguard_alert_threshold_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  applied_devices INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_alert_threshold_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own threshold profiles" ON public.vanguard_alert_threshold_profiles FOR ALL USING (auth.uid() = user_id);

-- Alert Threshold Rules
CREATE TABLE IF NOT EXISTS public.vanguard_alert_threshold_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.vanguard_alert_threshold_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric TEXT NOT NULL DEFAULT 'cpu',
  operator TEXT NOT NULL DEFAULT '>',
  value NUMERIC NOT NULL DEFAULT 80,
  duration INTEGER NOT NULL DEFAULT 300,
  severity TEXT NOT NULL DEFAULT 'warning',
  enabled BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_webhook BOOLEAN DEFAULT false,
  auto_remediate BOOLEAN DEFAULT false,
  remediation_script TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vanguard_alert_threshold_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own threshold rules" ON public.vanguard_alert_threshold_rules FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vanguard_device_groups_user ON public.vanguard_device_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_device_group_members_group ON public.vanguard_device_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_maintenance_windows_user ON public.vanguard_maintenance_windows(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_policy_templates_user ON public.vanguard_policy_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_alert_threshold_profiles_user ON public.vanguard_alert_threshold_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_alert_threshold_rules_profile ON public.vanguard_alert_threshold_rules(profile_id);

-- Updated_at triggers
CREATE TRIGGER update_vanguard_device_groups_updated_at BEFORE UPDATE ON public.vanguard_device_groups FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_maintenance_windows_updated_at BEFORE UPDATE ON public.vanguard_maintenance_windows FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_policy_templates_updated_at BEFORE UPDATE ON public.vanguard_policy_templates FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_alert_threshold_profiles_updated_at BEFORE UPDATE ON public.vanguard_alert_threshold_profiles FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_alert_threshold_rules_updated_at BEFORE UPDATE ON public.vanguard_alert_threshold_rules FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
