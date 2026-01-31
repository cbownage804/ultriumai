-- Fix overly permissive RLS policy on ticket chat messages
DROP POLICY IF EXISTS "Users access ticket chat" ON public.vanguard_ticket_chat_messages;

-- Create proper policy: users can access chat for tickets they're involved with
CREATE POLICY "Users access own ticket chat" ON public.vanguard_ticket_chat_messages 
FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.vanguard_service_tickets t 
        WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
);

CREATE POLICY "Users insert ticket chat" ON public.vanguard_ticket_chat_messages 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users update own chat messages" ON public.vanguard_ticket_chat_messages 
FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users delete own chat messages" ON public.vanguard_ticket_chat_messages 
FOR DELETE USING (sender_id = auth.uid());