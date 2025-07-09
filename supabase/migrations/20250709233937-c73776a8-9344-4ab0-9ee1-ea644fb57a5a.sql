-- Add support agents table
CREATE TABLE public.support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  department TEXT,
  skills TEXT[],
  max_concurrent_tickets INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add SLA policies table
CREATE TABLE public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  priority_level TEXT NOT NULL,
  first_response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  escalation_hours INTEGER,
  business_hours_only BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add ticket templates table
CREATE TABLE public.ticket_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  estimated_hours INTEGER,
  tags TEXT[],
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add client contacts table
CREATE TABLE public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  communication_preferences JSONB DEFAULT '{"email": true, "phone": true, "sms": false}',
  timezone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add ticket assignments table
CREATE TABLE public.ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  assignment_reason TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Add ticket internal notes table
CREATE TABLE public.ticket_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  note_content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add ticket escalations table
CREATE TABLE public.ticket_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  escalated_from UUID,
  escalated_to UUID NOT NULL,
  escalation_reason TEXT NOT NULL,
  escalation_type TEXT NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_by UUID NOT NULL
);

-- Add ticket activities table for audit trail
CREATE TABLE public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add support metrics table
CREATE TABLE public.support_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  agent_id UUID,
  client_id UUID,
  total_tickets INTEGER DEFAULT 0,
  resolved_tickets INTEGER DEFAULT 0,
  avg_first_response_hours NUMERIC,
  avg_resolution_hours NUMERIC,
  customer_satisfaction_score NUMERIC,
  sla_breaches INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhance helpdesk_tickets table with new columns
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS sla_policy_id UUID;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS actual_hours INTEGER;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS customer_satisfaction INTEGER;
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.helpdesk_tickets ADD COLUMN IF NOT EXISTS contact_id UUID;

-- Enhance msp_clients table
ALTER TABLE public.msp_clients ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'healthy';
ALTER TABLE public.msp_clients ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE public.msp_clients ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC;
ALTER TABLE public.msp_clients ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.msp_clients ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}';

-- Create foreign key constraints
ALTER TABLE public.ticket_assignments ADD CONSTRAINT fk_ticket_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_assignments ADD CONSTRAINT fk_ticket_assignments_agent FOREIGN KEY (agent_id) REFERENCES public.support_agents(id);

ALTER TABLE public.ticket_internal_notes ADD CONSTRAINT fk_ticket_notes_ticket FOREIGN KEY (ticket_id) REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_internal_notes ADD CONSTRAINT fk_ticket_notes_agent FOREIGN KEY (agent_id) REFERENCES public.support_agents(id);

ALTER TABLE public.ticket_escalations ADD CONSTRAINT fk_ticket_escalations_ticket FOREIGN KEY (ticket_id) REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE;
ALTER TABLE public.ticket_escalations ADD CONSTRAINT fk_ticket_escalations_to FOREIGN KEY (escalated_to) REFERENCES public.support_agents(id);

ALTER TABLE public.ticket_activities ADD CONSTRAINT fk_ticket_activities_ticket FOREIGN KEY (ticket_id) REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE;

ALTER TABLE public.client_contacts ADD CONSTRAINT fk_client_contacts_client FOREIGN KEY (client_id) REFERENCES public.msp_clients(id) ON DELETE CASCADE;

ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT fk_helpdesk_tickets_sla FOREIGN KEY (sla_policy_id) REFERENCES public.sla_policies(id);
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT fk_helpdesk_tickets_contact FOREIGN KEY (contact_id) REFERENCES public.client_contacts(id);

-- Create indexes for performance
CREATE INDEX idx_ticket_assignments_ticket_id ON public.ticket_assignments(ticket_id);
CREATE INDEX idx_ticket_assignments_agent_id ON public.ticket_assignments(agent_id);
CREATE INDEX idx_ticket_internal_notes_ticket_id ON public.ticket_internal_notes(ticket_id);
CREATE INDEX idx_ticket_activities_ticket_id ON public.ticket_activities(ticket_id);
CREATE INDEX idx_helpdesk_tickets_sla_due_at ON public.helpdesk_tickets(sla_due_at);
CREATE INDEX idx_helpdesk_tickets_priority_status ON public.helpdesk_tickets(priority, status);
CREATE INDEX idx_support_metrics_date ON public.support_metrics(date);
CREATE INDEX idx_client_contacts_client_id ON public.client_contacts(client_id);

-- Enable RLS on new tables
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "MSP can manage their support agents" ON public.support_agents
  FOR ALL USING (user_id IN (
    SELECT user_id FROM public.msps WHERE user_id = auth.uid()
    UNION
    SELECT ms.user_id FROM public.msp_staff ms WHERE ms.user_id = auth.uid() AND ms.is_active = true
  ));

CREATE POLICY "MSP can manage SLA policies" ON public.sla_policies
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their ticket templates" ON public.ticket_templates
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "MSP can manage client contacts" ON public.client_contacts
  FOR ALL USING (client_id IN (
    SELECT id FROM public.msp_clients WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "MSP can view ticket assignments" ON public.ticket_assignments
  FOR ALL USING (ticket_id IN (
    SELECT id FROM public.helpdesk_tickets WHERE customer_id IN (
      SELECT id FROM public.msp_clients WHERE msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "MSP can manage ticket notes" ON public.ticket_internal_notes
  FOR ALL USING (ticket_id IN (
    SELECT id FROM public.helpdesk_tickets WHERE customer_id IN (
      SELECT id FROM public.msp_clients WHERE msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "MSP can view ticket escalations" ON public.ticket_escalations
  FOR ALL USING (ticket_id IN (
    SELECT id FROM public.helpdesk_tickets WHERE customer_id IN (
      SELECT id FROM public.msp_clients WHERE msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "MSP can view ticket activities" ON public.ticket_activities
  FOR ALL USING (ticket_id IN (
    SELECT id FROM public.helpdesk_tickets WHERE customer_id IN (
      SELECT id FROM public.msp_clients WHERE msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "MSP can view support metrics" ON public.support_metrics
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.msp_clients WHERE msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
      )
    ) OR 
    agent_id IN (
      SELECT id FROM public.support_agents WHERE user_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_agents_updated_at BEFORE UPDATE ON public.support_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sla_policies_updated_at BEFORE UPDATE ON public.sla_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ticket_templates_updated_at BEFORE UPDATE ON public.ticket_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_contacts_updated_at BEFORE UPDATE ON public.client_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ticket_internal_notes_updated_at BEFORE UPDATE ON public.ticket_internal_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_metrics_updated_at BEFORE UPDATE ON public.support_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SLA policies
INSERT INTO public.sla_policies (name, description, priority_level, first_response_hours, resolution_hours, escalation_hours) VALUES
('Critical SLA', 'For critical business-impacting issues', 'critical', 1, 4, 2),
('High Priority SLA', 'For high priority issues', 'high', 4, 24, 8),
('Medium Priority SLA', 'For medium priority issues', 'medium', 8, 72, 24),
('Low Priority SLA', 'For low priority issues', 'low', 24, 168, 72);

-- Create function to automatically assign SLA based on priority
CREATE OR REPLACE FUNCTION assign_sla_to_ticket()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign SLA policy based on priority
  NEW.sla_policy_id = (
    SELECT id FROM public.sla_policies 
    WHERE priority_level = NEW.priority 
    AND is_active = true 
    LIMIT 1
  );
  
  -- Calculate SLA due date
  IF NEW.sla_policy_id IS NOT NULL THEN
    NEW.sla_due_at = NEW.created_at + (
      SELECT (resolution_hours || ' hours')::INTERVAL 
      FROM public.sla_policies 
      WHERE id = NEW.sla_policy_id
    );
  END IF;
  
  -- Set last activity
  NEW.last_activity_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SLA assignment
CREATE TRIGGER assign_sla_on_ticket_create 
  BEFORE INSERT ON public.helpdesk_tickets 
  FOR EACH ROW EXECUTE FUNCTION assign_sla_to_ticket();

-- Create function to log ticket activities
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the activity
  INSERT INTO public.ticket_activities (ticket_id, user_id, activity_type, description, old_values, new_values)
  VALUES (
    NEW.id,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Ticket created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
      WHEN TG_OP = 'UPDATE' AND OLD.priority != NEW.priority THEN 'Priority changed from ' || OLD.priority || ' to ' || NEW.priority
      ELSE 'Ticket updated'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  
  -- Update last activity time
  NEW.last_activity_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for activity logging
CREATE TRIGGER log_ticket_activity_trigger 
  AFTER INSERT OR UPDATE ON public.helpdesk_tickets 
  FOR EACH ROW EXECUTE FUNCTION log_ticket_activity();