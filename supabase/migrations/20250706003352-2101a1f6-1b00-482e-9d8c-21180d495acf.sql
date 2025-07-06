-- Create MSPs table for service providers
CREATE TABLE public.msps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- The UltriumAI user who owns this MSP
  company_name TEXT NOT NULL,
  domain TEXT UNIQUE, -- e.g., "acmemsp" for acmemsp.safepass.com
  brand_name TEXT DEFAULT 'SafePass',
  brand_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af', 
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  max_clients INTEGER DEFAULT 10,
  monthly_rate_per_user DECIMAL(10,2) DEFAULT 15.00, -- What MSP charges clients
  commission_rate DECIMAL(5,4) DEFAULT 0.6667, -- MSP keeps 66.67% ($10 of $15)
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MSP clients table (businesses served by MSPs)
CREATE TABLE public.msp_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  domain TEXT, -- client's domain for widget embedding
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  max_users INTEGER DEFAULT 5,
  current_users INTEGER DEFAULT 0,
  monthly_rate DECIMAL(10,2) NOT NULL, -- What client pays MSP
  billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
  last_billed_at TIMESTAMP WITH TIME ZONE,
  widget_enabled BOOLEAN DEFAULT true,
  webapp_enabled BOOLEAN DEFAULT false,
  api_enabled BOOLEAN DEFAULT false,
  custom_branding JSONB DEFAULT '{}',
  integration_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update password_vaults to support MSP client isolation
ALTER TABLE public.password_vaults 
ADD COLUMN msp_client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE;

-- Update password_entries to support MSP client isolation  
ALTER TABLE public.password_entries
ADD COLUMN msp_client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE;

-- Create MSP usage tracking
CREATE TABLE public.msp_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'login', 'password_create', 'password_access', etc.
  widget_type TEXT, -- 'embed', 'webapp', 'api'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MSP revenue tracking
CREATE TABLE public.msp_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  users_count INTEGER NOT NULL,
  client_charge DECIMAL(10,2) NOT NULL, -- What MSP charges client
  ultrium_fee DECIMAL(10,2) NOT NULL,   -- What MSP pays Ultrium
  msp_profit DECIMAL(10,2) NOT NULL,    -- MSP's profit
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.msps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_clients ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.msp_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MSPs
CREATE POLICY "MSPs can manage their own records" 
ON public.msps 
FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for MSP Clients
CREATE POLICY "MSPs can manage their clients" 
ON public.msp_clients 
FOR ALL 
USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- RLS Policies for MSP Usage Logs
CREATE POLICY "MSPs can view their usage logs" 
ON public.msp_usage_logs 
FOR SELECT 
USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

CREATE POLICY "System can insert usage logs" 
ON public.msp_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for MSP Revenue
CREATE POLICY "MSPs can view their revenue" 
ON public.msp_revenue 
FOR ALL 
USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- Update password vault policies to include MSP client isolation
DROP POLICY IF EXISTS "Users can view shared team vaults" ON public.password_vaults;
DROP POLICY IF EXISTS "Users can view their own vaults" ON public.password_vaults;

CREATE POLICY "Users can view their vaults or MSP client vaults" 
ON public.password_vaults 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (team_id IS NOT NULL AND is_team_member(auth.uid(), team_id)) OR
  (msp_client_id IS NOT NULL AND msp_client_id IN (
    SELECT mc.id FROM public.msp_clients mc 
    JOIN public.msps m ON mc.msp_id = m.id 
    WHERE m.user_id = auth.uid()
  ))
);

-- Update password entry policies to include MSP client isolation
DROP POLICY IF EXISTS "Users can view their own password entries" ON public.password_entries;

CREATE POLICY "Users can view their password entries or MSP client entries" 
ON public.password_entries 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  auth.uid() = ANY (shared_with) OR 
  (vault_id IN (
    SELECT pv.id FROM public.password_vaults pv 
    WHERE pv.user_id = auth.uid() OR 
    (pv.team_id IS NOT NULL AND is_team_member(auth.uid(), pv.team_id)) OR
    (pv.msp_client_id IS NOT NULL AND pv.msp_client_id IN (
      SELECT mc.id FROM public.msp_clients mc 
      JOIN public.msps m ON mc.msp_id = m.id 
      WHERE m.user_id = auth.uid()
    ))
  ))
);

-- Create indexes for performance
CREATE INDEX idx_msps_user_id ON public.msps(user_id);
CREATE INDEX idx_msp_clients_msp_id ON public.msp_clients(msp_id);
CREATE INDEX idx_password_vaults_msp_client_id ON public.password_vaults(msp_client_id);
CREATE INDEX idx_password_entries_msp_client_id ON public.password_entries(msp_client_id);
CREATE INDEX idx_msp_usage_logs_msp_id ON public.msp_usage_logs(msp_id);
CREATE INDEX idx_msp_usage_logs_client_id ON public.msp_usage_logs(client_id);
CREATE INDEX idx_msp_revenue_msp_id ON public.msp_revenue(msp_id);

-- Create trigger for updated_at
CREATE TRIGGER update_msps_updated_at
  BEFORE UPDATE ON public.msps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_msp_clients_updated_at
  BEFORE UPDATE ON public.msp_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_msp_revenue_updated_at
  BEFORE UPDATE ON public.msp_revenue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();