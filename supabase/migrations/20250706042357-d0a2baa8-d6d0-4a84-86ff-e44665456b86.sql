-- SafeWeb Production Database Schema

-- Monitored Assets Table
CREATE TABLE public.safeweb_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_client_id UUID NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('email', 'domain', 'brand', 'executive', 'ip_range')),
  asset_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  scan_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (scan_frequency IN ('hourly', 'daily', 'weekly')),
  last_scan_at TIMESTAMP WITH TIME ZONE NULL,
  next_scan_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  threats_found INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dark Web Threats Table
CREATE TABLE public.safeweb_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_client_id UUID NULL,
  asset_id UUID NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN ('credential', 'data_breach', 'threat_actor', 'marketplace', 'brand_mention', 'executive_mention')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive')),
  source_name TEXT NOT NULL,
  source_url TEXT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}',
  affected_assets TEXT[] NOT NULL DEFAULT '{}',
  threat_indicators JSONB NOT NULL DEFAULT '{}',
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_by UUID NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MSP Clients Table
CREATE TABLE public.safeweb_msp_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  domain TEXT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NULL,
  billing_email TEXT NULL,
  subscription_plan TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 299.00,
  max_assets INTEGER NOT NULL DEFAULT 10,
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  last_billed_at TIMESTAMP WITH TIME ZONE NULL,
  next_billing_date DATE NOT NULL DEFAULT (CURRENT_DATE + interval '1 month'),
  settings JSONB NOT NULL DEFAULT '{}',
  branding JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MSP Billing Records
CREATE TABLE public.safeweb_msp_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  client_charge DECIMAL(10,2) NOT NULL,
  ultrium_fee DECIMAL(10,2) NOT NULL,
  msp_profit DECIMAL(10,2) NOT NULL,
  asset_count INTEGER NOT NULL DEFAULT 0,
  threat_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')),
  invoice_id TEXT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan Jobs Table
CREATE TABLE public.safeweb_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('scheduled', 'manual', 'bulk')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  scan_sources TEXT[] NOT NULL DEFAULT '{}',
  threats_found INTEGER NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  scan_results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Threat Intelligence Sources
CREATE TABLE public.safeweb_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('forum', 'marketplace', 'database', 'api', 'crawler')),
  base_url TEXT NULL,
  reliability_score INTEGER NOT NULL DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  api_config JSONB NOT NULL DEFAULT '{}',
  last_accessed TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safeweb_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeweb_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeweb_msp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeweb_msp_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeweb_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safeweb_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Assets
CREATE POLICY "Users can manage their own assets" ON public.safeweb_assets
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "MSPs can manage client assets" ON public.safeweb_assets
  FOR ALL USING (
    msp_client_id IN (
      SELECT id FROM public.safeweb_msp_clients 
      WHERE msp_user_id = auth.uid()
    )
  );

-- RLS Policies for Threats
CREATE POLICY "Users can view their own threats" ON public.safeweb_threats
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "MSPs can view client threats" ON public.safeweb_threats
  FOR ALL USING (
    msp_client_id IN (
      SELECT id FROM public.safeweb_msp_clients 
      WHERE msp_user_id = auth.uid()
    )
  );

-- RLS Policies for MSP Clients
CREATE POLICY "MSPs can manage their own clients" ON public.safeweb_msp_clients
  FOR ALL USING (msp_user_id = auth.uid());

-- RLS Policies for MSP Billing
CREATE POLICY "MSPs can view their own billing" ON public.safeweb_msp_billing
  FOR ALL USING (msp_user_id = auth.uid());

-- RLS Policies for Scan Jobs
CREATE POLICY "Users can manage their own scan jobs" ON public.safeweb_scan_jobs
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for Sources (admin only for now)
CREATE POLICY "System can manage sources" ON public.safeweb_sources
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_safeweb_assets_user_id ON public.safeweb_assets(user_id);
CREATE INDEX idx_safeweb_assets_client_id ON public.safeweb_assets(msp_client_id);
CREATE INDEX idx_safeweb_assets_next_scan ON public.safeweb_assets(next_scan_at) WHERE status = 'active';

CREATE INDEX idx_safeweb_threats_user_id ON public.safeweb_threats(user_id);
CREATE INDEX idx_safeweb_threats_client_id ON public.safeweb_threats(msp_client_id);
CREATE INDEX idx_safeweb_threats_severity ON public.safeweb_threats(severity);
CREATE INDEX idx_safeweb_threats_status ON public.safeweb_threats(status);
CREATE INDEX idx_safeweb_threats_created ON public.safeweb_threats(created_at);

CREATE INDEX idx_safeweb_msp_clients_msp_user ON public.safeweb_msp_clients(msp_user_id);
CREATE INDEX idx_safeweb_msp_billing_msp_user ON public.safeweb_msp_billing(msp_user_id);
CREATE INDEX idx_safeweb_scan_jobs_user_id ON public.safeweb_scan_jobs(user_id);

-- Create update triggers
CREATE TRIGGER update_safeweb_assets_updated_at
  BEFORE UPDATE ON public.safeweb_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safeweb_threats_updated_at
  BEFORE UPDATE ON public.safeweb_threats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safeweb_msp_clients_updated_at
  BEFORE UPDATE ON public.safeweb_msp_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default threat intelligence sources
INSERT INTO public.safeweb_sources (name, source_type, reliability_score, is_active) VALUES
('DarkWeb Intelligence API', 'api', 85, true),
('Breach Database Monitor', 'database', 90, true),
('Underground Forums', 'forum', 75, true),
('Cybercrime Marketplaces', 'marketplace', 80, true),
('Deep Web Crawler', 'crawler', 70, true);