-- Fix helpdesk_ticket_handoffs - use correct column names
DROP POLICY IF EXISTS "Handoffs access" ON public.helpdesk_ticket_handoffs;
CREATE POLICY "hth_select_authenticated"
ON public.helpdesk_ticket_handoffs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "hth_insert_authenticated"
ON public.helpdesk_ticket_handoffs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = from_technician_id OR auth.uid() = to_technician_id);