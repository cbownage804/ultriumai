-- Create client portal announcements table (if not exists)
CREATE TABLE IF NOT EXISTS public.client_portal_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  service_description TEXT,
  service_type TEXT NOT NULL CHECK (service_type IN ('infrastructure', 'security', 'backup', 'monitoring', 'support', 'compliance', 'cloud', 'software')),
  service_status TEXT NOT NULL CHECK (service_status IN ('active', 'inactive', 'maintenance', 'degraded', 'outage')) DEFAULT 'active',
  service_health INTEGER CHECK (service_health BETWEEN 0 AND 100) DEFAULT 100,
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  monthly_cost NUMERIC(10,2),
  contract_end_date DATE,
  service_contacts JSONB DEFAULT '{}',
  service_metrics JSONB DEFAULT '{}',
  documentation_url TEXT,
  is_billable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client portal requests table
CREATE TABLE IF NOT EXISTS public.client_portal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('service_request', 'access_request', 'change_request', 'incident_report', 'consultation', 'quote_request')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected')) DEFAULT 'submitted',
  requested_by UUID NOT NULL,
  assigned_to UUID,
  business_justification TEXT,
  estimated_cost NUMERIC(10,2),
  requested_completion_date DATE,
  actual_completion_date DATE,
  approval_notes TEXT,
  rejection_reason TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client portal knowledge base table
CREATE TABLE IF NOT EXISTS public.client_portal_kb (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  last_updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client portal notifications table
CREATE TABLE IF NOT EXISTS public.client_portal_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('maintenance', 'outage', 'update', 'security_alert', 'billing', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  acknowledgment_required BOOLEAN DEFAULT false,
  acknowledged_by JSONB DEFAULT '[]',
  affected_services TEXT[] DEFAULT '{}',
  action_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.client_portal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_kb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_portal_services
CREATE POLICY "Clients can view their own services" ON public.client_portal_services
  FOR SELECT USING (
    client_id IN (
      SELECT client_users.client_id FROM client_users 
      WHERE client_users.user_id = auth.uid() AND client_users.is_active = true
    )
  );

CREATE POLICY "MSPs can manage client services" ON public.client_portal_services
  FOR ALL USING (
    client_id IN (
      SELECT msp_clients.id FROM msp_clients 
      JOIN msps ON msps.id = msp_clients.msp_id 
      WHERE msps.user_id = auth.uid()
    )
  );

-- Create RLS policies for client_portal_requests
CREATE POLICY "Clients can view and create their own requests" ON public.client_portal_requests
  FOR ALL USING (
    client_id IN (
      SELECT client_users.client_id FROM client_users 
      WHERE client_users.user_id = auth.uid() AND client_users.is_active = true
    ) OR requested_by = auth.uid()
  );

CREATE POLICY "MSPs can manage client requests" ON public.client_portal_requests
  FOR ALL USING (
    client_id IN (
      SELECT msp_clients.id FROM msp_clients 
      JOIN msps ON msps.id = msp_clients.msp_id 
      WHERE msps.user_id = auth.uid()
    )
  );

-- Create RLS policies for client_portal_kb
CREATE POLICY "Clients can view public KB and their own articles" ON public.client_portal_kb
  FOR SELECT USING (
    is_public = true OR 
    client_id IN (
      SELECT client_users.client_id FROM client_users 
      WHERE client_users.user_id = auth.uid() AND client_users.is_active = true
    )
  );

CREATE POLICY "MSPs can manage KB articles" ON public.client_portal_kb
  FOR ALL USING (
    client_id IN (
      SELECT msp_clients.id FROM msp_clients 
      JOIN msps ON msps.id = msp_clients.msp_id 
      WHERE msps.user_id = auth.uid()
    ) OR client_id IS NULL
  );

-- Create RLS policies for client_portal_notifications
CREATE POLICY "Clients can view their notifications" ON public.client_portal_notifications
  FOR SELECT USING (
    client_id IN (
      SELECT client_users.client_id FROM client_users 
      WHERE client_users.user_id = auth.uid() AND client_users.is_active = true
    )
  );

CREATE POLICY "MSPs can manage client notifications" ON public.client_portal_notifications
  FOR ALL USING (
    client_id IN (
      SELECT msp_clients.id FROM msp_clients 
      JOIN msps ON msps.id = msp_clients.msp_id 
      WHERE msps.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_portal_services_client_id ON public.client_portal_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_services_status ON public.client_portal_services(service_status);
CREATE INDEX IF NOT EXISTS idx_client_portal_services_type ON public.client_portal_services(service_type);

CREATE INDEX IF NOT EXISTS idx_client_portal_requests_client_id ON public.client_portal_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_requests_status ON public.client_portal_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_portal_requests_priority ON public.client_portal_requests(priority);
CREATE INDEX IF NOT EXISTS idx_client_portal_requests_requested_by ON public.client_portal_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_client_portal_kb_client_id ON public.client_portal_kb(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_kb_category ON public.client_portal_kb(category);
CREATE INDEX IF NOT EXISTS idx_client_portal_kb_public ON public.client_portal_kb(is_public);

CREATE INDEX IF NOT EXISTS idx_client_portal_notifications_client_id ON public.client_portal_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_notifications_type ON public.client_portal_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_client_portal_notifications_active ON public.client_portal_notifications(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_client_portal_services_updated_at
  BEFORE UPDATE ON public.client_portal_services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_client_portal_requests_updated_at
  BEFORE UPDATE ON public.client_portal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_client_portal_kb_updated_at
  BEFORE UPDATE ON public.client_portal_kb
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_client_portal_notifications_updated_at
  BEFORE UPDATE ON public.client_portal_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();