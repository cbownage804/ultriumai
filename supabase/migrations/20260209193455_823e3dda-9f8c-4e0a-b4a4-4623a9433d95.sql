
-- On-Call Schedule tables
CREATE TABLE public.oncall_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oncall_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own oncall team" ON public.oncall_team_members FOR ALL USING (auth.uid() = user_id);

CREATE TABLE public.oncall_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_id UUID REFERENCES public.oncall_team_members(id) ON DELETE CASCADE,
  shift_type TEXT NOT NULL DEFAULT 'primary', -- primary, backup
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.oncall_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own oncall shifts" ON public.oncall_shifts FOR ALL USING (auth.uid() = user_id);

-- Alert Suppression Windows
CREATE TABLE public.alert_suppression_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  window_type TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, recurring, adhoc
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  recurring_days INTEGER[],
  scope TEXT NOT NULL DEFAULT 'all', -- all, devices, rules
  scope_items TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alert_suppression_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own suppression windows" ON public.alert_suppression_windows FOR ALL USING (auth.uid() = user_id);

-- White Label / Branding Configs
CREATE TABLE public.white_label_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#06b6d4',
  secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  accent_color TEXT NOT NULL DEFAULT '#10b981',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  company_name TEXT NOT NULL,
  company_tagline TEXT,
  footer_text TEXT,
  header_layout TEXT NOT NULL DEFAULT 'left',
  show_powered_by BOOLEAN DEFAULT false,
  custom_css TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.white_label_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own white label configs" ON public.white_label_configs FOR ALL USING (auth.uid() = user_id);

-- Runbook alert trigger rules (for RunbookAlertTrigger component)
CREATE TABLE public.runbook_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  alert_severity TEXT NOT NULL DEFAULT 'high',
  runbook_id UUID REFERENCES public.vanguard_runbooks(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.runbook_alert_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own runbook alert rules" ON public.runbook_alert_rules FOR ALL USING (auth.uid() = user_id);
