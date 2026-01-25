-- Add RLS policies to helpdesk tables based on their actual schema

-- helpdesk_chat_messages: Access through conversation ownership (system/admin only for now)
CREATE POLICY "Authenticated users can view chat messages"
ON public.helpdesk_chat_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage chat messages"
ON public.helpdesk_chat_messages
FOR ALL
TO service_role
USING (true);

-- helpdesk_issue_patterns: Read-only for authenticated, admin manages
CREATE POLICY "Authenticated users can view issue patterns"
ON public.helpdesk_issue_patterns
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage issue patterns"
ON public.helpdesk_issue_patterns
FOR INSERT
TO authenticated
WITH CHECK (public.is_ultrium_employee(auth.uid()));

CREATE POLICY "Admins can update issue patterns"
ON public.helpdesk_issue_patterns
FOR UPDATE
TO authenticated
USING (public.is_ultrium_employee(auth.uid()));

CREATE POLICY "Admins can delete issue patterns"
ON public.helpdesk_issue_patterns
FOR DELETE
TO authenticated
USING (public.is_ultrium_employee(auth.uid()));

-- helpdesk_sentiment_logs: Access through client_id relationship
CREATE POLICY "Authenticated users can view sentiment logs"
ON public.helpdesk_sentiment_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage sentiment logs"
ON public.helpdesk_sentiment_logs
FOR ALL
TO service_role
USING (true);

-- Revoke public/anon access from these tables
REVOKE ALL ON public.helpdesk_chat_messages FROM anon;
REVOKE ALL ON public.helpdesk_issue_patterns FROM anon;
REVOKE ALL ON public.helpdesk_sentiment_logs FROM anon;

-- Grant only to authenticated
GRANT SELECT, INSERT ON public.helpdesk_chat_messages TO authenticated;
GRANT SELECT ON public.helpdesk_issue_patterns TO authenticated;
GRANT SELECT ON public.helpdesk_sentiment_logs TO authenticated;