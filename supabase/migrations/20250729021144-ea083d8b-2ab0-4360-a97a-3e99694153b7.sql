-- Create tickets table (main table) - only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tickets (
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

-- Create ticket attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket templates table
CREATE TABLE IF NOT EXISTS public.ticket_templates (
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

-- Add foreign key constraint for ticket_attachments if tickets table was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public') THEN
    ALTER TABLE public.ticket_attachments 
    ADD CONSTRAINT fk_ticket_attachments_ticket_id 
    FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public') THEN
    ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_attachments' AND table_schema = 'public') THEN
    ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_templates' AND table_schema = 'public') THEN
    ALTER TABLE public.ticket_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for tickets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Users can view tickets they created or are assigned to" ON public.tickets
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
      )';
      
    EXECUTE 'CREATE POLICY "Users can create tickets" ON public.tickets
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
      
    EXECUTE 'CREATE POLICY "MSPs and assigned users can update tickets" ON public.tickets
      FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = assigned_to OR
        client_id IN (
          SELECT msp_clients.id FROM msp_clients 
          JOIN msps ON msps.id = msp_clients.msp_id 
          WHERE msps.user_id = auth.uid()
        )
      )';
  END IF;
END $$;

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