-- Create role system for co-managed helpdesk
-- Add user roles for MSP staff and client staff
CREATE TYPE IF NOT EXISTS public.helpdesk_role AS ENUM ('msp_admin', 'msp_staff', 'client_admin', 'client_staff');

-- Create client users table for MSP client staff access
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role helpdesk_role NOT NULL DEFAULT 'client_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Create MSP staff table
CREATE TABLE IF NOT EXISTS public.msp_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role helpdesk_role NOT NULL DEFAULT 'msp_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(msp_id, user_id)
);

-- Add internal notes and visibility controls to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS is_internal_visible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS msp_id UUID REFERENCES public.msps(id);

-- Create ticket comments table for threaded discussions
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  visibility_level TEXT DEFAULT 'all', -- 'all', 'msp_only', 'internal_only'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- MSP staff policies
CREATE POLICY "MSP owners can manage their staff" ON public.msp_staff
FOR ALL USING (
  msp_id IN (
    SELECT id FROM public.msps WHERE user_id = auth.uid()
  )
);

CREATE POLICY "MSP staff can view their own record" ON public.msp_staff
FOR SELECT USING (user_id = auth.uid());

-- Client users policies  
CREATE POLICY "MSP can manage client users" ON public.client_users
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Client users can view their own record" ON public.client_users
FOR SELECT USING (user_id = auth.uid());

-- Enhanced support tickets policies (replace existing)
DROP POLICY IF EXISTS "MSPs can manage their client tickets" ON public.support_tickets;

CREATE POLICY "MSPs can manage all client tickets" ON public.support_tickets
FOR ALL USING (
  -- MSP owners and staff can see all tickets for their clients
  (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())) OR
  (msp_id IN (SELECT msp_id FROM public.msp_staff WHERE user_id = auth.uid() AND is_active = true))
);

CREATE POLICY "Client users can view their tickets" ON public.support_tickets
FOR SELECT USING (
  client_id IN (
    SELECT client_id FROM public.client_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Client users can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT client_id FROM public.client_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Ticket comments policies
CREATE POLICY "MSP can view all comments" ON public.ticket_comments
FOR SELECT USING (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
      UNION
      SELECT msp_id FROM public.msp_staff WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Client users can view non-internal comments" ON public.ticket_comments
FOR SELECT USING (
  is_internal = false AND
  ticket_id IN (
    SELECT st.id FROM public.support_tickets st
    JOIN public.client_users cu ON st.client_id = cu.client_id
    WHERE cu.user_id = auth.uid() AND cu.is_active = true
  )
);

CREATE POLICY "Users can create comments on accessible tickets" ON public.ticket_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND (
    -- MSP can comment on their tickets
    ticket_id IN (
      SELECT id FROM public.support_tickets 
      WHERE msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
        UNION
        SELECT msp_id FROM public.msp_staff WHERE user_id = auth.uid() AND is_active = true
      )
    ) OR
    -- Client users can comment on their tickets (non-internal only)
    (is_internal = false AND ticket_id IN (
      SELECT st.id FROM public.support_tickets st
      JOIN public.client_users cu ON st.client_id = cu.client_id
      WHERE cu.user_id = auth.uid() AND cu.is_active = true
    ))
  )
);

-- Create function to get user's helpdesk role for a specific context
CREATE OR REPLACE FUNCTION public.get_helpdesk_role(_user_id uuid, _context_id uuid DEFAULT NULL)
RETURNS helpdesk_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Check if user is MSP owner
  SELECT 'msp_admin'::helpdesk_role
  FROM public.msps 
  WHERE user_id = _user_id
  UNION ALL
  
  -- Check if user is MSP staff
  SELECT role
  FROM public.msp_staff
  WHERE user_id = _user_id AND is_active = true
  UNION ALL
  
  -- Check if user is client user
  SELECT role
  FROM public.client_users
  WHERE user_id = _user_id AND is_active = true
  AND (CASE WHEN _context_id IS NOT NULL THEN client_id = _context_id ELSE true END)
  
  LIMIT 1;
$$;