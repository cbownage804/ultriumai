-- Create tickets table (main table)
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  assigned_to UUID,
  sla_policy_id UUID,
  parent_ticket_id UUID,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')) DEFAULT 'open',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN ('email', 'portal', 'phone', 'chat', 'internal')) DEFAULT 'portal',
  due_date TIMESTAMP WITH TIME ZONE,
  sla_due_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  billable_hours NUMERIC DEFAULT 0,
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket comments table
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket attachments table
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket templates table
CREATE TABLE public.ticket_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_hours NUMERIC,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tickets
CREATE POLICY "Users can view tickets they created or are assigned to" ON public.tickets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    client_id IN (
      SELECT msp_clients.id FROM msp_clients 
      JOIN msps ON msps.id = msp_clients.msp_id 
      WHERE msps.user_id = auth.uid()
    ) OR
    client_id IN (
      SELECT client_users.client_id FROM client_users 
      WHERE client_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "MSPs and assigned users can update tickets" ON public.tickets
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    client_id IN (
      SELECT msp_clients.id FROM msp_clients 
      JOIN msps ON msps.id = msp_clients.msp_id 
      WHERE msps.user_id = auth.uid()
    )
  );

-- Create RLS policies for ticket comments
CREATE POLICY "Users can view comments for accessible tickets" ON public.ticket_comments
  FOR SELECT USING (
    ticket_id IN (
      SELECT tickets.id FROM public.tickets 
      WHERE auth.uid() = tickets.user_id OR 
            auth.uid() = tickets.assigned_to OR
            tickets.client_id IN (
              SELECT msp_clients.id FROM msp_clients 
              JOIN msps ON msps.id = msp_clients.msp_id 
              WHERE msps.user_id = auth.uid()
            )
    ) AND (is_internal = false OR auth.uid() IN (
      SELECT msps.user_id FROM msps 
      UNION 
      SELECT msp_staff.user_id FROM msp_staff WHERE msp_staff.is_active = true
    ))
  );

CREATE POLICY "Users can create comments on accessible tickets" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    ticket_id IN (
      SELECT tickets.id FROM public.tickets 
      WHERE auth.uid() = tickets.user_id OR 
            auth.uid() = tickets.assigned_to OR
            tickets.client_id IN (
              SELECT msp_clients.id FROM msp_clients 
              JOIN msps ON msps.id = msp_clients.msp_id 
              WHERE msps.user_id = auth.uid()
            )
    )
  );

-- Create RLS policies for ticket attachments
CREATE POLICY "Users can view attachments for accessible tickets" ON public.ticket_attachments
  FOR SELECT USING (
    ticket_id IN (
      SELECT tickets.id FROM public.tickets 
      WHERE auth.uid() = tickets.user_id OR 
            auth.uid() = tickets.assigned_to OR
            tickets.client_id IN (
              SELECT msp_clients.id FROM msp_clients 
              JOIN msps ON msps.id = msp_clients.msp_id 
              WHERE msps.user_id = auth.uid()
            )
    )
  );

CREATE POLICY "Users can upload attachments to accessible tickets" ON public.ticket_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    ticket_id IN (
      SELECT tickets.id FROM public.tickets 
      WHERE auth.uid() = tickets.user_id OR 
            auth.uid() = tickets.assigned_to OR
            tickets.client_id IN (
              SELECT msp_clients.id FROM msp_clients 
              JOIN msps ON msps.id = msp_clients.msp_id 
              WHERE msps.user_id = auth.uid()
            )
    )
  );

-- Create RLS policies for ticket templates
CREATE POLICY "Users can manage their own ticket templates" ON public.ticket_templates
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX idx_tickets_ticket_number ON public.tickets(ticket_number);

CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON public.ticket_comments(created_at);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    next_number INTEGER;
    ticket_number TEXT;
BEGIN
    -- Get the next ticket number (simple incrementing)
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'TKT-(\d+)') AS INTEGER)), 0) + 1
    FROM public.tickets
    INTO next_number;
    
    ticket_number := 'TKT-' || LPAD(next_number::TEXT, 6, '0');
    RETURN ticket_number;
END;
$$;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number();

-- Create trigger for updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON public.ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_ticket_templates_updated_at
  BEFORE UPDATE ON public.ticket_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create trigger for logging ticket activities (using existing function)
CREATE TRIGGER log_ticket_activity_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_activity();

-- Create trigger for SLA assignment (using existing function)
CREATE TRIGGER assign_sla_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_sla_to_ticket();