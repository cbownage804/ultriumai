-- Vanguard Production Tables for remaining modules

-- 1. Threshold Profiles for device monitoring
CREATE TABLE public.vanguard_threshold_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. IT Automation Profiles
CREATE TABLE public.vanguard_automation_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schedule JSONB NOT NULL DEFAULT '{"type": "daily", "time": "02:00", "enabled": true}'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  run_on_connect BOOLEAN DEFAULT false,
  notify_on_complete BOOLEAN DEFAULT true,
  notify_on_failure BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Client Billing Portal data
CREATE TABLE public.vanguard_client_portal_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  client_name TEXT NOT NULL,
  current_balance NUMERIC(10,2) DEFAULT 0,
  devices_managed INTEGER DEFAULT 0,
  storage_used_gb NUMERIC(10,2) DEFAULT 0,
  api_calls_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Client Usage History for billing trends
CREATE TABLE public.vanguard_client_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  month TEXT NOT NULL,
  devices INTEGER DEFAULT 0,
  storage_gb NUMERIC(10,2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Vulnerability Suppression Rules
CREATE TABLE public.vanguard_vuln_suppression_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  suppression_type TEXT NOT NULL CHECK (suppression_type IN ('false_positive', 'accepted_risk', 'addressed', 'temporary')),
  criteria JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  vuln_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Sentinel Alert Trends (aggregated data)
CREATE TABLE public.vanguard_sentinel_alert_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trend_date DATE NOT NULL,
  day_name TEXT,
  total_alerts INTEGER DEFAULT 0,
  resolved_alerts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trend_date)
);

-- 7. Sentinel Threat Distribution
CREATE TABLE public.vanguard_sentinel_threat_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  threat_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, threat_type)
);

-- 8. Device Patch Data (per-device patch status)
CREATE TABLE public.vanguard_device_patches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.rmm_devices(id) ON DELETE CASCADE,
  kb_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('critical', 'important', 'moderate', 'low')),
  category TEXT CHECK (category IN ('security', 'feature', 'driver', 'definition', 'other')),
  size_mb NUMERIC(10,2),
  release_date DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'approved', 'declined', 'installed', 'failed', 'pending_reboot')),
  cve_ids TEXT[],
  installed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Patch Policies
CREATE TABLE public.vanguard_patch_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  auto_approve_critical BOOLEAN DEFAULT true,
  auto_approve_important BOOLEAN DEFAULT false,
  auto_approve_moderate BOOLEAN DEFAULT false,
  auto_approve_low BOOLEAN DEFAULT false,
  exclude_drivers BOOLEAN DEFAULT true,
  deployment_window_start TEXT DEFAULT '02:00',
  deployment_window_end TEXT DEFAULT '06:00',
  reboot_policy TEXT DEFAULT 'scheduled' CHECK (reboot_policy IN ('immediate', 'scheduled', 'user_choice', 'suppress')),
  max_concurrent_installs INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vanguard_threshold_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_automation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_client_portal_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_client_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_vuln_suppression_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_sentinel_alert_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_sentinel_threat_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_device_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_patch_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Users can manage their threshold profiles" ON public.vanguard_threshold_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their automation profiles" ON public.vanguard_automation_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their client billing" ON public.vanguard_client_portal_billing FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their usage history" ON public.vanguard_client_usage_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their suppression rules" ON public.vanguard_vuln_suppression_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their alert trends" ON public.vanguard_sentinel_alert_trends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their threat distribution" ON public.vanguard_sentinel_threat_distribution FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their device patches" ON public.vanguard_device_patches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their patch policies" ON public.vanguard_patch_policies FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_threshold_profiles_user ON public.vanguard_threshold_profiles(user_id);
CREATE INDEX idx_automation_profiles_user ON public.vanguard_automation_profiles(user_id);
CREATE INDEX idx_client_billing_user ON public.vanguard_client_portal_billing(user_id);
CREATE INDEX idx_usage_history_user_client ON public.vanguard_client_usage_history(user_id, client_id);
CREATE INDEX idx_suppression_rules_user ON public.vanguard_vuln_suppression_rules(user_id);
CREATE INDEX idx_alert_trends_user_date ON public.vanguard_sentinel_alert_trends(user_id, trend_date);
CREATE INDEX idx_threat_dist_user ON public.vanguard_sentinel_threat_distribution(user_id);
CREATE INDEX idx_device_patches_user_device ON public.vanguard_device_patches(user_id, device_id);
CREATE INDEX idx_patch_policies_user ON public.vanguard_patch_policies(user_id);