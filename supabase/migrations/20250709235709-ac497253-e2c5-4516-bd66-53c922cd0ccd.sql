-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  ticket_created BOOLEAN DEFAULT true,
  ticket_updated BOOLEAN DEFAULT true,
  ticket_assigned BOOLEAN DEFAULT true,
  sla_breach BOOLEAN DEFAULT true,
  escalation BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge articles table  
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time entries table
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticket_id UUID,
  description TEXT NOT NULL,
  hours_worked DECIMAL(10,2) NOT NULL,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  work_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Email templates policies
CREATE POLICY "Users can manage their own email templates" ON public.email_templates
FOR ALL USING (user_id = auth.uid());

-- Notification settings policies  
CREATE POLICY "Users can manage their own notification settings" ON public.notification_settings
FOR ALL USING (user_id = auth.uid());

-- Knowledge articles policies
CREATE POLICY "Users can manage their own knowledge articles" ON public.knowledge_articles
FOR ALL USING (user_id = auth.uid());

-- Time entries policies
CREATE POLICY "Users can manage their own time entries" ON public.time_entries
FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_email_templates_user_id ON public.email_templates(user_id);
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX idx_knowledge_articles_user_id ON public.knowledge_articles(user_id);
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_ticket_id ON public.time_entries(ticket_id);

-- Add updated_at triggers
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();