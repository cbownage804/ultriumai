-- Create custom ticket fields table
CREATE TABLE public.custom_ticket_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, textarea, select, multiselect, checkbox, date, number
  label TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]', -- For select/multiselect fields
  default_value TEXT,
  validation_rules JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow automation rules table
CREATE TABLE public.workflow_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- ticket_created, ticket_updated, status_changed, priority_changed, etc.
  conditions JSONB NOT NULL DEFAULT '[]', -- Array of condition objects
  actions JSONB NOT NULL DEFAULT '[]', -- Array of action objects
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escalation rules table
CREATE TABLE public.escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  escalation_levels JSONB NOT NULL DEFAULT '[]', -- Array of escalation level objects
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket field values table (for storing custom field values)
CREATE TABLE public.ticket_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  field_id UUID NOT NULL REFERENCES public.custom_ticket_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, field_id)
);

-- Create automation execution logs table
CREATE TABLE public.automation_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.workflow_automation_rules(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL,
  execution_status TEXT NOT NULL, -- success, failed, skipped
  error_message TEXT,
  actions_executed JSONB DEFAULT '[]',
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.custom_ticket_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own custom fields" ON public.custom_ticket_fields
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own workflow rules" ON public.workflow_automation_rules
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own escalation rules" ON public.escalation_rules
FOR ALL USING (user_id = auth.uid());

-- Note: Using customer_id instead of user_id for helpdesk_tickets
CREATE POLICY "Users can manage ticket field values for their tickets" ON public.ticket_field_values
FOR ALL USING (
  ticket_id IN (
    SELECT id FROM helpdesk_tickets WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Users can view automation logs for their rules" ON public.automation_execution_logs
FOR SELECT USING (
  rule_id IN (
    SELECT id FROM workflow_automation_rules WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert automation logs" ON public.automation_execution_logs
FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_custom_ticket_fields_user_id ON public.custom_ticket_fields(user_id);
CREATE INDEX idx_custom_ticket_fields_position ON public.custom_ticket_fields(position);
CREATE INDEX idx_workflow_rules_user_id ON public.workflow_automation_rules(user_id);
CREATE INDEX idx_workflow_rules_trigger ON public.workflow_automation_rules(trigger_event);
CREATE INDEX idx_escalation_rules_user_id ON public.escalation_rules(user_id);
CREATE INDEX idx_ticket_field_values_ticket ON public.ticket_field_values(ticket_id);
CREATE INDEX idx_ticket_field_values_field ON public.ticket_field_values(field_id);
CREATE INDEX idx_automation_logs_rule_id ON public.automation_execution_logs(rule_id);
CREATE INDEX idx_automation_logs_ticket_id ON public.automation_execution_logs(ticket_id);

-- Add updated_at triggers
CREATE TRIGGER update_custom_ticket_fields_updated_at
  BEFORE UPDATE ON public.custom_ticket_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_automation_rules_updated_at
  BEFORE UPDATE ON public.workflow_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escalation_rules_updated_at
  BEFORE UPDATE ON public.escalation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_field_values_updated_at
  BEFORE UPDATE ON public.ticket_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();