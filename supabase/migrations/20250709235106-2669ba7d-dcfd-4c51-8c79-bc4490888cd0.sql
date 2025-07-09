-- Email Integration & Notifications Enhancement (Fixed)

-- Email templates for different ticket events
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'ticket_created', 'ticket_updated', 'ticket_resolved', 'sla_breach', 'escalation'
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email notification settings per MSP
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  slack_enabled BOOLEAN DEFAULT false,
  notification_events JSONB DEFAULT '["ticket_created", "ticket_updated", "sla_breach"]'::jsonb,
  email_from_name TEXT DEFAULT 'Support Team',
  email_from_address TEXT,
  auto_response_enabled BOOLEAN DEFAULT true,
  escalation_notifications BOOLEAN DEFAULT true,
  client_notifications BOOLEAN DEFAULT true,
  agent_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email parsing rules for ticket creation
CREATE TABLE public.email_parsing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL, -- Support email address to monitor
  priority_keywords JSONB DEFAULT '[]'::jsonb, -- Keywords that set priority
  category_keywords JSONB DEFAULT '{}'::jsonb, -- Keywords that set category
  auto_assignment_rules JSONB DEFAULT '{}'::jsonb, -- Rules for auto-assigning tickets
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automated workflow rules
CREATE TABLE public.workflow_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'ticket_created', 'ticket_updated', 'sla_breach', 'time_elapsed'
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Conditions that must be met
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Actions to perform
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Escalation rules
CREATE TABLE public.escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_condition TEXT NOT NULL, -- 'sla_breach', 'time_elapsed', 'priority_high'
  escalation_levels JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of escalation steps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Knowledge base for client self-service
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_public BOOLEAN DEFAULT true, -- Public for clients, false for internal
  view_count INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  unhelpful_votes INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Time tracking for agents
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  description TEXT,
  hours_worked DECIMAL(5,2) NOT NULL,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Client portal access
CREATE TABLE public.client_portal_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin', 'user'
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(email)
);

-- Integrations settings
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'slack', 'teams', 'zapier', 'email'
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(msp_id, integration_type)
);

-- Add indexes for performance
CREATE INDEX idx_email_templates_user_type ON public.email_templates(user_id, template_type);
CREATE INDEX idx_notification_settings_msp ON public.notification_settings(msp_id);
CREATE INDEX idx_workflow_rules_msp_event ON public.workflow_rules(msp_id, trigger_event);
CREATE INDEX idx_knowledge_articles_msp_category ON public.knowledge_articles(msp_id, category);
CREATE INDEX idx_time_entries_ticket ON public.time_entries(ticket_id);
CREATE INDEX idx_time_entries_agent ON public.time_entries(agent_id);
CREATE INDEX idx_client_portal_users_client ON public.client_portal_users(client_id);
CREATE INDEX idx_integration_settings_msp ON public.integration_settings(msp_id);

-- Add RLS policies
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_parsing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Users can manage their own email templates" ON public.email_templates
  FOR ALL USING (user_id = auth.uid());

-- Notification settings policies  
CREATE POLICY "MSP owners can manage notification settings" ON public.notification_settings
  FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- Email parsing rules policies
CREATE POLICY "MSP owners can manage email parsing rules" ON public.email_parsing_rules
  FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- Workflow rules policies
CREATE POLICY "MSP owners can manage workflow rules" ON public.workflow_rules
  FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- Escalation rules policies
CREATE POLICY "MSP owners can manage escalation rules" ON public.escalation_rules
  FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- Knowledge articles policies
CREATE POLICY "MSP can manage their knowledge articles" ON public.knowledge_articles
  FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

CREATE POLICY "Public articles are viewable by everyone" ON public.knowledge_articles
  FOR SELECT USING (is_public = true);

-- Time entries policies
CREATE POLICY "Agents can manage their own time entries" ON public.time_entries
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "MSP owners can view all time entries for their tickets" ON public.time_entries
  FOR SELECT USING (ticket_id IN (SELECT id FROM public.helpdesk_tickets WHERE user_id = auth.uid()));

-- Client portal users policies
CREATE POLICY "MSP owners can manage client portal users" ON public.client_portal_users
  FOR ALL USING (client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
  ));

-- Integration settings policies
CREATE POLICY "MSP owners can manage integration settings" ON public.integration_settings
  FOR ALL USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_rules_updated_at
  BEFORE UPDATE ON public.workflow_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_portal_users_updated_at
  BEFORE UPDATE ON public.client_portal_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to send email notifications for ticket events
CREATE OR REPLACE FUNCTION public.send_ticket_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_enabled BOOLEAN;
  template_exists BOOLEAN;
BEGIN
  -- Check if notifications are enabled (simplified for now)
  notification_enabled := true;

  -- If notifications are enabled, queue the email
  IF notification_enabled = true THEN
    -- Insert into a notifications queue (we'll handle this in the edge function)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      COALESCE(NEW.assigned_to, NEW.user_id),
      'ticket_notification',
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'New Ticket Created'
        WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'Ticket Status Updated'
        ELSE 'Ticket Updated'
      END,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'A new ticket has been created: ' || NEW.subject
        WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'Ticket status changed from ' || OLD.status || ' to ' || NEW.status
        ELSE 'Ticket has been updated: ' || NEW.subject
      END,
      json_build_object(
        'ticket_id', NEW.id,
        'event_type', CASE 
          WHEN TG_OP = 'INSERT' THEN 'created'
          WHEN TG_OP = 'UPDATE' THEN 'updated'
          ELSE 'unknown'
        END
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket notifications
CREATE TRIGGER ticket_notification_trigger
  AFTER INSERT OR UPDATE ON public.helpdesk_tickets
  FOR EACH ROW EXECUTE FUNCTION public.send_ticket_notification();