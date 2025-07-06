-- Create RMM customers table
CREATE TABLE IF NOT EXISTS public.rmm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RMM devices table
CREATE TABLE IF NOT EXISTS public.rmm_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.rmm_customers(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  os_info TEXT,
  device_type TEXT DEFAULT 'desktop',
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  agent_version TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_logged_user TEXT,
  cpu_usage INTEGER DEFAULT 0,
  memory_usage INTEGER DEFAULT 0,
  disk_usage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, hostname)
);

-- Create helpdesk tickets table for ticketing integration
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.rmm_customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT DEFAULT 'general',
  assigned_to UUID,
  device_context JSONB DEFAULT '{}',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.rmm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MSP access
CREATE POLICY "MSPs can manage their customers" ON public.rmm_customers
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "MSPs can manage customer devices" ON public.rmm_devices
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM public.rmm_customers 
      WHERE auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "MSPs can manage customer tickets" ON public.helpdesk_tickets
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM public.rmm_customers 
      WHERE auth.uid() IS NOT NULL
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rmm_customers_company_name ON public.rmm_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_rmm_devices_customer_id ON public.rmm_devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_rmm_devices_hostname ON public.rmm_devices(hostname);
CREATE INDEX IF NOT EXISTS idx_rmm_devices_status ON public.rmm_devices(status);
CREATE INDEX IF NOT EXISTS idx_rmm_devices_last_seen ON public.rmm_devices(last_seen);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_customer_id ON public.helpdesk_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON public.helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_created_at ON public.helpdesk_tickets(created_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_rmm_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_rmm_customers_updated_at
  BEFORE UPDATE ON public.rmm_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rmm_updated_at_column();

CREATE TRIGGER update_rmm_devices_updated_at
  BEFORE UPDATE ON public.rmm_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rmm_updated_at_column();

CREATE TRIGGER update_helpdesk_tickets_updated_at
  BEFORE UPDATE ON public.helpdesk_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rmm_updated_at_column();