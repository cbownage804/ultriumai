-- Fix overly permissive RLS policies that use USING(true) or WITH CHECK(true)
-- These should be restricted to authenticated users or service_role

-- 1. Fix alert_notifications - should be service_role only for system operations
DROP POLICY IF EXISTS "System can manage alert notifications" ON public.alert_notifications;
DROP POLICY IF EXISTS "System can update alert notifications" ON public.alert_notifications;

CREATE POLICY "Service role can insert alert notifications"
ON public.alert_notifications FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update alert notifications"
ON public.alert_notifications FOR UPDATE TO service_role
USING (true);

CREATE POLICY "Users can view own alert notifications"
ON public.alert_notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix asset_history - should be service_role only
DROP POLICY IF EXISTS "System can insert asset history" ON public.asset_history;

CREATE POLICY "Service role can insert asset history"
ON public.asset_history FOR INSERT TO service_role
WITH CHECK (true);

-- 3. Fix automation_execution_logs - should be service_role only
DROP POLICY IF EXISTS "System can insert automation logs" ON public.automation_execution_logs;

CREATE POLICY "Service role can insert automation logs"
ON public.automation_execution_logs FOR INSERT TO service_role
WITH CHECK (true);

-- 4. Fix contact_messages - keep public insert but restrict to anon role only
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 5. Fix crawled_pages - should be service_role only
DROP POLICY IF EXISTS "System can manage crawled pages" ON public.crawled_pages;

CREATE POLICY "Service role can manage crawled pages"
ON public.crawled_pages FOR INSERT TO service_role
WITH CHECK (true);

-- 6. Fix edr_ml_models - should be service_role only
DROP POLICY IF EXISTS "System can manage ML models" ON public.edr_ml_models;
DROP POLICY IF EXISTS "System can update ML models" ON public.edr_ml_models;

CREATE POLICY "Service role can insert ML models"
ON public.edr_ml_models FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update ML models"
ON public.edr_ml_models FOR UPDATE TO service_role
USING (true);

-- 7. Fix incident_activities - should be service_role only
DROP POLICY IF EXISTS "System can create incident activities" ON public.incident_activities;

CREATE POLICY "Service role can insert incident activities"
ON public.incident_activities FOR INSERT TO service_role
WITH CHECK (true);

-- 8. Fix knowledge_chunks - should be service_role only
DROP POLICY IF EXISTS "System can manage knowledge chunks" ON public.knowledge_chunks;

CREATE POLICY "Service role can insert knowledge chunks"
ON public.knowledge_chunks FOR INSERT TO service_role
WITH CHECK (true);

-- 9. Fix msp_notifications - should be service_role only
DROP POLICY IF EXISTS "System can insert notifications" ON public.msp_notifications;

CREATE POLICY "Service role can insert msp notifications"
ON public.msp_notifications FOR INSERT TO service_role
WITH CHECK (true);

-- 10. Fix msp_quickbooks_sync_log - should be service_role only
DROP POLICY IF EXISTS "System can insert sync logs" ON public.msp_quickbooks_sync_log;
DROP POLICY IF EXISTS "System can update sync logs" ON public.msp_quickbooks_sync_log;

CREATE POLICY "Service role can insert sync logs"
ON public.msp_quickbooks_sync_log FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update sync logs"
ON public.msp_quickbooks_sync_log FOR UPDATE TO service_role
USING (true);

-- 11. Fix msp_usage_logs - should be service_role only
DROP POLICY IF EXISTS "System can insert usage logs" ON public.msp_usage_logs;

CREATE POLICY "Service role can insert usage logs"
ON public.msp_usage_logs FOR INSERT TO service_role
WITH CHECK (true);

-- 12. Fix msp_workflow_executions - should be service_role only
DROP POLICY IF EXISTS "System can insert workflow executions" ON public.msp_workflow_executions;
DROP POLICY IF EXISTS "System can update workflow executions" ON public.msp_workflow_executions;

CREATE POLICY "Service role can insert workflow executions"
ON public.msp_workflow_executions FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update workflow executions"
ON public.msp_workflow_executions FOR UPDATE TO service_role
USING (true);

-- 13. Fix network_connectors - should be service_role only
DROP POLICY IF EXISTS "System can update connector status" ON public.network_connectors;

CREATE POLICY "Service role can update network connectors"
ON public.network_connectors FOR UPDATE TO service_role
USING (true);

-- 14. Fix network_findings - should be service_role only
DROP POLICY IF EXISTS "System can insert scan results" ON public.network_findings;

CREATE POLICY "Service role can insert network findings"
ON public.network_findings FOR INSERT TO service_role
WITH CHECK (true);

-- 15. Fix network_scan_jobs - should be service_role only
DROP POLICY IF EXISTS "System can update scan jobs" ON public.network_scan_jobs;

CREATE POLICY "Service role can update network scan jobs"
ON public.network_scan_jobs FOR UPDATE TO service_role
USING (true);

-- 16. Fix notifications - should be service_role only for insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT TO service_role
WITH CHECK (true);

-- 17. Fix rmm_agent_system_info - should be service_role only
DROP POLICY IF EXISTS "System can insert agent system info" ON public.rmm_agent_system_info;

CREATE POLICY "Service role can insert agent system info"
ON public.rmm_agent_system_info FOR INSERT TO service_role
WITH CHECK (true);

-- 18. Fix rmm_session_events - should be service_role only
DROP POLICY IF EXISTS "System can insert session events" ON public.rmm_session_events;

CREATE POLICY "Service role can insert session events"
ON public.rmm_session_events FOR INSERT TO service_role
WITH CHECK (true);

-- 19. Fix safedoc_scans - should be service_role only for system operations
DROP POLICY IF EXISTS "System can insert scans" ON public.safedoc_scans;
DROP POLICY IF EXISTS "System can update scans" ON public.safedoc_scans;

CREATE POLICY "Service role can insert safedoc scans"
ON public.safedoc_scans FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update safedoc scans"
ON public.safedoc_scans FOR UPDATE TO service_role
USING (true);

-- 20. Fix safenet_connectors - should be service_role only
DROP POLICY IF EXISTS "System can update connector status" ON public.safenet_connectors;

CREATE POLICY "Service role can update safenet connectors"
ON public.safenet_connectors FOR UPDATE TO service_role
USING (true);

-- 21. Fix safenet_devices - should be service_role only
DROP POLICY IF EXISTS "System can insert devices" ON public.safenet_devices;
DROP POLICY IF EXISTS "System can update devices" ON public.safenet_devices;

CREATE POLICY "Service role can insert safenet devices"
ON public.safenet_devices FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update safenet devices"
ON public.safenet_devices FOR UPDATE TO service_role
USING (true);

-- 22. Fix safenet_scans - should be service_role only
DROP POLICY IF EXISTS "System can insert scan results" ON public.safenet_scans;

CREATE POLICY "Service role can insert safenet scans"
ON public.safenet_scans FOR INSERT TO service_role
WITH CHECK (true);