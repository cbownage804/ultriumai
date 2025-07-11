-- Create MSP organizations table
CREATE TABLE public.msp_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  billing_email TEXT,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MSP clients table
CREATE TABLE public.msp_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES msp_organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  domain TEXT,
  max_users INTEGER DEFAULT 5,
  current_users INTEGER DEFAULT 0,
  billing_status TEXT DEFAULT 'active',
  monthly_rate DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  onboarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM endpoints table
CREATE TABLE public.rmm_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES msp_clients(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  os_info TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cpu_usage INTEGER,
  memory_usage INTEGER,
  disk_usage INTEGER,
  antivirus_status JSONB DEFAULT '{}',
  agent_version TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RMM alerts table
CREATE TABLE public.rmm_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES msp_clients(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES rmm_endpoints(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support tickets table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES msp_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.msp_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MSP organizations
CREATE POLICY "Users can manage their own MSP organization" 
ON public.msp_organizations 
FOR ALL 
USING (user_id = auth.uid());

-- Create RLS policies for MSP clients
CREATE POLICY "MSPs can manage their own clients" 
ON public.msp_clients 
FOR ALL 
USING (msp_id IN (
  SELECT id FROM msp_organizations WHERE user_id = auth.uid()
));

-- Create RLS policies for RMM endpoints
CREATE POLICY "MSPs can manage endpoints for their clients" 
ON public.rmm_endpoints 
FOR ALL 
USING (client_id IN (
  SELECT msp_clients.id FROM msp_clients 
  JOIN msp_organizations ON msp_clients.msp_id = msp_organizations.id 
  WHERE msp_organizations.user_id = auth.uid()
));

-- Create RLS policies for RMM alerts
CREATE POLICY "MSPs can manage alerts for their clients" 
ON public.rmm_alerts 
FOR ALL 
USING (client_id IN (
  SELECT msp_clients.id FROM msp_clients 
  JOIN msp_organizations ON msp_clients.msp_id = msp_organizations.id 
  WHERE msp_organizations.user_id = auth.uid()
));

-- Create RLS policies for support tickets
CREATE POLICY "MSPs can manage tickets for their clients" 
ON public.support_tickets 
FOR ALL 
USING (client_id IN (
  SELECT msp_clients.id FROM msp_clients 
  JOIN msp_organizations ON msp_clients.msp_id = msp_organizations.id 
  WHERE msp_organizations.user_id = auth.uid()
));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_msp_organizations_updated_at
  BEFORE UPDATE ON public.msp_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_msp_clients_updated_at
  BEFORE UPDATE ON public.msp_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rmm_endpoints_updated_at
  BEFORE UPDATE ON public.rmm_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rmm_alerts_updated_at
  BEFORE UPDATE ON public.rmm_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();