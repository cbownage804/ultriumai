-- Fix service role policies to use is_service_role() instead of USING (true)
-- This prevents client-side abuse while still allowing edge functions to work

-- alert_notifications
DROP POLICY IF EXISTS "Service role can insert alert notifications" ON public.alert_notifications;
DROP POLICY IF EXISTS "Service role can update alert notifications" ON public.alert_notifications;
CREATE POLICY "Service role can insert alert notifications" ON public.alert_notifications FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update alert notifications" ON public.alert_notifications FOR UPDATE USING (is_service_role());

-- api_usage_logs
DROP POLICY IF EXISTS "api_usage_logs_insert_service_role" ON public.api_usage_logs;
CREATE POLICY "Service role can insert api usage logs" ON public.api_usage_logs FOR INSERT WITH CHECK (is_service_role());

-- asset_history
DROP POLICY IF EXISTS "Service role can insert asset history" ON public.asset_history;
CREATE POLICY "Service role can insert asset history" ON public.asset_history FOR INSERT WITH CHECK (is_service_role());

-- automation_execution_logs
DROP POLICY IF EXISTS "Service role can insert automation logs" ON public.automation_execution_logs;
CREATE POLICY "Service role can insert automation logs" ON public.automation_execution_logs FOR INSERT WITH CHECK (is_service_role());

-- crawled_pages
DROP POLICY IF EXISTS "Service role can manage crawled pages" ON public.crawled_pages;
CREATE POLICY "Service role can manage crawled pages" ON public.crawled_pages FOR INSERT WITH CHECK (is_service_role());

-- edr_ml_models
DROP POLICY IF EXISTS "Service role can insert ML models" ON public.edr_ml_models;
DROP POLICY IF EXISTS "Service role can update ML models" ON public.edr_ml_models;
CREATE POLICY "Service role can insert ML models" ON public.edr_ml_models FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update ML models" ON public.edr_ml_models FOR UPDATE USING (is_service_role());

-- funnel_events
DROP POLICY IF EXISTS "Service role can insert funnel events" ON public.funnel_events;
CREATE POLICY "Service role can insert funnel events" ON public.funnel_events FOR INSERT WITH CHECK (is_service_role());

-- incident_activities
DROP POLICY IF EXISTS "Service role can insert incident activities" ON public.incident_activities;
CREATE POLICY "Service role can insert incident activities" ON public.incident_activities FOR INSERT WITH CHECK (is_service_role());

-- knowledge_chunks
DROP POLICY IF EXISTS "Service role can insert knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Service role can insert knowledge chunks" ON public.knowledge_chunks FOR INSERT WITH CHECK (is_service_role());

-- msp_notifications
DROP POLICY IF EXISTS "Service role can insert msp notifications" ON public.msp_notifications;
CREATE POLICY "Service role can insert msp notifications" ON public.msp_notifications FOR INSERT WITH CHECK (is_service_role());

-- msp_quickbooks_sync_log
DROP POLICY IF EXISTS "Service role can insert sync logs" ON public.msp_quickbooks_sync_log;
DROP POLICY IF EXISTS "Service role can update sync logs" ON public.msp_quickbooks_sync_log;
CREATE POLICY "Service role can insert sync logs" ON public.msp_quickbooks_sync_log FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update sync logs" ON public.msp_quickbooks_sync_log FOR UPDATE USING (is_service_role());

-- msp_usage_logs
DROP POLICY IF EXISTS "Service role can insert usage logs" ON public.msp_usage_logs;
CREATE POLICY "Service role can insert usage logs" ON public.msp_usage_logs FOR INSERT WITH CHECK (is_service_role());

-- msp_workflow_executions
DROP POLICY IF EXISTS "Service role can insert workflow executions" ON public.msp_workflow_executions;
DROP POLICY IF EXISTS "Service role can update workflow executions" ON public.msp_workflow_executions;
CREATE POLICY "Service role can insert workflow executions" ON public.msp_workflow_executions FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update workflow executions" ON public.msp_workflow_executions FOR UPDATE USING (is_service_role());

-- network_connectors
DROP POLICY IF EXISTS "Service role can update network connectors" ON public.network_connectors;
CREATE POLICY "Service role can update network connectors" ON public.network_connectors FOR UPDATE USING (is_service_role());

-- network_findings
DROP POLICY IF EXISTS "Service role can insert network findings" ON public.network_findings;
CREATE POLICY "Service role can insert network findings" ON public.network_findings FOR INSERT WITH CHECK (is_service_role());

-- network_scan_jobs
DROP POLICY IF EXISTS "Service role can update network scan jobs" ON public.network_scan_jobs;
CREATE POLICY "Service role can update network scan jobs" ON public.network_scan_jobs FOR UPDATE USING (is_service_role());

-- notifications
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK (is_service_role());

-- rmm_agent_system_info
DROP POLICY IF EXISTS "Service role can insert agent system info" ON public.rmm_agent_system_info;
CREATE POLICY "Service role can insert agent system info" ON public.rmm_agent_system_info FOR INSERT WITH CHECK (is_service_role());

-- rmm_session_events
DROP POLICY IF EXISTS "Service role can insert session events" ON public.rmm_session_events;
CREATE POLICY "Service role can insert session events" ON public.rmm_session_events FOR INSERT WITH CHECK (is_service_role());

-- safedoc_scans
DROP POLICY IF EXISTS "Service role can insert safedoc scans" ON public.safedoc_scans;
DROP POLICY IF EXISTS "Service role can update safedoc scans" ON public.safedoc_scans;
CREATE POLICY "Service role can insert safedoc scans" ON public.safedoc_scans FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update safedoc scans" ON public.safedoc_scans FOR UPDATE USING (is_service_role());

-- safenet_connectors
DROP POLICY IF EXISTS "Service role can update safenet connectors" ON public.safenet_connectors;
CREATE POLICY "Service role can update safenet connectors" ON public.safenet_connectors FOR UPDATE USING (is_service_role());

-- safenet_devices
DROP POLICY IF EXISTS "Service role can insert safenet devices" ON public.safenet_devices;
DROP POLICY IF EXISTS "Service role can update safenet devices" ON public.safenet_devices;
CREATE POLICY "Service role can insert safenet devices" ON public.safenet_devices FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update safenet devices" ON public.safenet_devices FOR UPDATE USING (is_service_role());

-- safenet_scans
DROP POLICY IF EXISTS "Service role can insert safenet scans" ON public.safenet_scans;
CREATE POLICY "Service role can insert safenet scans" ON public.safenet_scans FOR INSERT WITH CHECK (is_service_role());

-- security_alerts
DROP POLICY IF EXISTS "Service role can insert security alerts" ON public.security_alerts;
CREATE POLICY "Service role can insert security alerts" ON public.security_alerts FOR INSERT WITH CHECK (is_service_role());

-- security_app_subscriptions
DROP POLICY IF EXISTS "Service role can update security app subscriptions" ON public.security_app_subscriptions;
CREATE POLICY "Service role can update security app subscriptions" ON public.security_app_subscriptions FOR UPDATE USING (is_service_role());

-- security_events
DROP POLICY IF EXISTS "Service role can insert security events" ON public.security_events;
CREATE POLICY "Service role can insert security events" ON public.security_events FOR INSERT WITH CHECK (is_service_role());

-- system_health_metrics
DROP POLICY IF EXISTS "Service role can insert health metrics" ON public.system_health_metrics;
CREATE POLICY "Service role can insert health metrics" ON public.system_health_metrics FOR INSERT WITH CHECK (is_service_role());

-- user_activity_logs
DROP POLICY IF EXISTS "ual_insert_service_role" ON public.user_activity_logs;
CREATE POLICY "Service role can insert activity logs" ON public.user_activity_logs FOR INSERT WITH CHECK (is_service_role());

-- user_credits
DROP POLICY IF EXISTS "Service role can insert credits" ON public.user_credits;
DROP POLICY IF EXISTS "Service role can update credits" ON public.user_credits;
CREATE POLICY "Service role can insert credits" ON public.user_credits FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "Service role can update credits" ON public.user_credits FOR UPDATE USING (is_service_role());

-- vanguard_agent_commands
DROP POLICY IF EXISTS "Service role can update agent commands" ON public.vanguard_agent_commands;
CREATE POLICY "Service role can update agent commands" ON public.vanguard_agent_commands FOR UPDATE USING (is_service_role());

-- vanguard_agent_metrics
DROP POLICY IF EXISTS "Service role can insert agent metrics" ON public.vanguard_agent_metrics;
CREATE POLICY "Service role can insert agent metrics" ON public.vanguard_agent_metrics FOR INSERT WITH CHECK (is_service_role());

-- vanguard_security_events
DROP POLICY IF EXISTS "Service role can insert security events" ON public.vanguard_security_events;
CREATE POLICY "Service role can insert security events" ON public.vanguard_security_events FOR INSERT WITH CHECK (is_service_role());