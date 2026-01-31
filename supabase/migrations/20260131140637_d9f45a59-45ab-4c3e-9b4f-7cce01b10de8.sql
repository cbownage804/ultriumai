-- Fix helpdesk_tickets policy - simplified with admin access
-- Since the original structure was complex, just add admin override

CREATE POLICY "Admins can manage all helpdesk tickets"
ON public.helpdesk_tickets
FOR ALL
USING (public.is_admin_user());