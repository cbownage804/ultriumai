-- Create MSP organizations table
CREATE TABLE public.msp_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  subscription_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MSP clients table
CREATE TABLE public.msp_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  billing_status TEXT NOT NULL DEFAULT 'current',
  current_users INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  msp_id UUID REFERENCES public.msp_organizations(id) ON DELETE CASCADE,
  health_status TEXT DEFAULT 'healthy',
  contract_end_date TIMESTAMP WITH TIME ZONE,
  monthly_fee NUMERIC(10,2),
  timezone TEXT DEFAULT 'UTC',
  business_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support agents table
CREATE TABLE public.support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  department TEXT,
  skills TEXT[],
  max_concurrent_tickets INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket templates table
CREATE TABLE public.ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_hours INTEGER,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket assignments table
CREATE TABLE public.ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  agent_id UUID REFERENCES public.support_agents(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assignment_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket activities table
CREATE TABLE public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SLA policies table
CREATE TABLE public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority_level TEXT NOT NULL,
  first_response_hours INTEGER NOT NULL DEFAULT 2,
  resolution_hours INTEGER NOT NULL DEFAULT 24,
  escalation_hours INTEGER,
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.msp_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MSP organizations
CREATE POLICY "Users can view MSP organizations" ON public.msp_organizations FOR SELECT USING (true);
CREATE POLICY "Admins can manage MSP organizations" ON public.msp_organizations FOR ALL USING (is_current_user_admin());

-- Create RLS policies for MSP clients
CREATE POLICY "Users can view MSP clients" ON public.msp_clients FOR SELECT USING (true);
CREATE POLICY "Admins can manage MSP clients" ON public.msp_clients FOR ALL USING (is_current_user_admin());

-- Create RLS policies for support agents
CREATE POLICY "Users can view support agents" ON public.support_agents FOR SELECT USING (true);
CREATE POLICY "Admins can manage support agents" ON public.support_agents FOR ALL USING (is_current_user_admin());

-- Create RLS policies for ticket templates
CREATE POLICY "Users can view ticket templates" ON public.ticket_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage ticket templates" ON public.ticket_templates FOR ALL USING (is_current_user_admin());

-- Create RLS policies for ticket assignments
CREATE POLICY "Users can view ticket assignments" ON public.ticket_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage ticket assignments" ON public.ticket_assignments FOR ALL USING (is_current_user_admin());

-- Create RLS policies for ticket activities
CREATE POLICY "Users can view ticket activities" ON public.ticket_activities FOR SELECT USING (true);
CREATE POLICY "Admins can manage ticket activities" ON public.ticket_activities FOR ALL USING (is_current_user_admin());

-- Create RLS policies for SLA policies
CREATE POLICY "Users can view SLA policies" ON public.sla_policies FOR SELECT USING (true);
CREATE POLICY "Admins can manage SLA policies" ON public.sla_policies FOR ALL USING (is_current_user_admin());

-- Insert some sample data
INSERT INTO public.msp_organizations (organization_name, contact_email, contact_phone, status) VALUES
('TechCorp MSP', 'admin@techcorp.com', '+1-555-0123', 'active'),
('SecureIT Solutions', 'contact@secureit.com', '+1-555-0456', 'active'),
('CloudFirst MSP', 'info@cloudfirst.com', '+1-555-0789', 'active');

INSERT INTO public.msp_clients (company_name, contact_email, contact_name, msp_id, current_users, max_users, monthly_fee) VALUES
('ABC Manufacturing', 'it@abcmanufacturing.com', 'John Smith', (SELECT id FROM public.msp_organizations WHERE organization_name = 'TechCorp MSP' LIMIT 1), 25, 50, 2500.00),
('XYZ Consulting', 'support@xyzconsulting.com', 'Jane Doe', (SELECT id FROM public.msp_organizations WHERE organization_name = 'SecureIT Solutions' LIMIT 1), 15, 30, 1800.00),
('Digital Innovations', 'admin@digitalinnovations.com', 'Mike Johnson', (SELECT id FROM public.msp_organizations WHERE organization_name = 'CloudFirst MSP' LIMIT 1), 40, 75, 4200.00);

INSERT INTO public.sla_policies (name, priority_level, first_response_hours, resolution_hours) VALUES
('Critical SLA', 'critical', 1, 4),
('High Priority SLA', 'high', 2, 8),
('Medium Priority SLA', 'medium', 4, 24),
('Low Priority SLA', 'low', 8, 72);