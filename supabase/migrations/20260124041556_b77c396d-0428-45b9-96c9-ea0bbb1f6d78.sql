-- =============================================
-- CLEANUP AND FIX REMAINING PERMISSIVE POLICIES
-- =============================================

-- ticket_attachments - add policies (RLS enabled no policy)
CREATE POLICY "ta_select_owner"
ON public.ticket_attachments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "ta_insert_owner"
ON public.ticket_attachments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ta_delete_owner"
ON public.ticket_attachments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "ta_block_anon"
ON public.ticket_attachments FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- Drop remaining old permissive policies
DROP POLICY IF EXISTS "Canned responses admin manage" ON public.helpdesk_canned_responses;
DROP POLICY IF EXISTS "Chat messages public access" ON public.helpdesk_chat_messages;
DROP POLICY IF EXISTS "Issue patterns access" ON public.helpdesk_issue_patterns;
DROP POLICY IF EXISTS "Admins can manage KB articles" ON public.helpdesk_kb_articles;
DROP POLICY IF EXISTS "Sentiment logs access" ON public.helpdesk_sentiment_logs;
DROP POLICY IF EXISTS "Admins can manage technicians" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Users can manage patches" ON public.rmm_patches;
DROP POLICY IF EXISTS "system_can_manage_payments" ON public.one_time_payments;
DROP POLICY IF EXISTS "System can manage alerts" ON public.realtime_alerts;
DROP POLICY IF EXISTS "System can manage device commands" ON public.device_commands;
DROP POLICY IF EXISTS "System can manage daily analytics" ON public.daily_analytics;
DROP POLICY IF EXISTS "System can manage usage tracking" ON public.business_usage_tracking;
DROP POLICY IF EXISTS "Service role can manage client_portal_users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Handoffs access" ON public.helpdesk_ticket_handoffs;
DROP POLICY IF EXISTS "Users can manage policies" ON public.rmm_policies;

-- Fix rmm_policies
CREATE POLICY "rmpol_select_owner"
ON public.rmm_policies FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "rmpol_insert_owner"
ON public.rmm_policies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rmpol_update_owner"
ON public.rmm_policies FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "rmpol_delete_owner"
ON public.rmm_policies FOR DELETE TO authenticated
USING (auth.uid() = user_id);