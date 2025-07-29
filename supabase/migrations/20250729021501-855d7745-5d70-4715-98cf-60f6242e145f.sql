-- Add missing RLS policies for ticket_attachments and ticket_templates

-- RLS policies for ticket_attachments
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

-- RLS policies for ticket_templates
CREATE POLICY "Users can manage their own ticket templates" ON public.ticket_templates
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON public.tickets(ticket_number);

-- Create triggers for the tickets table
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

DROP TRIGGER IF EXISTS set_ticket_number_trigger ON public.tickets;
CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_ticket_templates_updated_at ON public.ticket_templates;
CREATE TRIGGER update_ticket_templates_updated_at
  BEFORE UPDATE ON public.ticket_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create trigger for logging ticket activities (using existing function)
DROP TRIGGER IF EXISTS log_ticket_activity_trigger ON public.tickets;
CREATE TRIGGER log_ticket_activity_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_activity();

-- Create trigger for SLA assignment (using existing function)
DROP TRIGGER IF EXISTS assign_sla_trigger ON public.tickets;
CREATE TRIGGER assign_sla_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_sla_to_ticket();