-- Fix all remaining RLS policies that use USING (true) or WITH CHECK (true)
-- Use service_role() for internal/system tables to prevent client-side abuse

-- 13. helpdesk_chat_messages - service role only (internal AI chat data)
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.helpdesk_chat_messages;
DROP POLICY IF EXISTS "Service role can manage chat messages" ON public.helpdesk_chat_messages;
CREATE POLICY "Service role can manage chat messages"
ON public.helpdesk_chat_messages FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 15. helpdesk_sentiment_logs - service role only (internal analytics)
DROP POLICY IF EXISTS "Authenticated users can view sentiment logs" ON public.helpdesk_sentiment_logs;
DROP POLICY IF EXISTS "Service role can manage sentiment logs" ON public.helpdesk_sentiment_logs;
CREATE POLICY "Service role can manage sentiment logs"
ON public.helpdesk_sentiment_logs FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 16. helpdesk_ticket_handoffs - service role only (internal workflow)
DROP POLICY IF EXISTS "hth_select_authenticated" ON public.helpdesk_ticket_handoffs;
CREATE POLICY "Service role can manage ticket handoffs"
ON public.helpdesk_ticket_handoffs FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());