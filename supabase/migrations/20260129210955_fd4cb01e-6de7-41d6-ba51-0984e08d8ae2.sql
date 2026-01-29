-- Create proper RLS policy for SLA tracking
-- Uses tickets table which has user_id, or allows MSP users
CREATE POLICY "Users can manage SLA tracking for their tickets" ON public.vanguard_ticket_sla_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tickets t 
            WHERE t.id = vanguard_ticket_sla_tracking.ticket_id 
            AND t.user_id = auth.uid()
        )
    );