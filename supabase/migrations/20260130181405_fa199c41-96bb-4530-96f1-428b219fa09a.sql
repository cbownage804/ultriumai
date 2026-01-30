-- Fix all remaining RLS policies that use USING (true) or WITH CHECK (true)
-- Complete migration covering all remaining tables

-- 1. api_usage_logs - duplicate policy cleanup
DROP POLICY IF EXISTS "api_usage_logs_select_service_role" ON public.api_usage_logs;

-- 2. asset_categories - remove duplicate, fix remaining
DROP POLICY IF EXISTS "asset_categories_select_authenticated" ON public.asset_categories;
DROP POLICY IF EXISTS "Only authenticated users can view asset categories" ON public.asset_categories;
CREATE POLICY "Authenticated users can view asset categories"
ON public.asset_categories FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 3. client_portal_settings - proper client check
DROP POLICY IF EXISTS "Clients can view their portal settings" ON public.client_portal_settings;
CREATE POLICY "MSP users can view their client portal settings"
ON public.client_portal_settings FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    WHERE mc.id = client_portal_settings.client_id
    AND mc.msp_id = auth.uid()
  )
);

-- 4. compliance_benchmarks - authenticated access
DROP POLICY IF EXISTS "Only authenticated users can view compliance benchmarks" ON public.compliance_benchmarks;
CREATE POLICY "Authenticated users can view compliance benchmarks"
ON public.compliance_benchmarks FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 5. compliance_frameworks - remove duplicates
DROP POLICY IF EXISTS "Authenticated users can view compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "compliance_frameworks_select_authenticated" ON public.compliance_frameworks;
CREATE POLICY "Authenticated users can view compliance frameworks"
ON public.compliance_frameworks FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 6. contact_form_rate_limits - service role only
DROP POLICY IF EXISTS "Service role manages contact form rate limits" ON public.contact_form_rate_limits;
CREATE POLICY "Service role manages contact form rate limits"
ON public.contact_form_rate_limits FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 7. contact_messages - service role only
DROP POLICY IF EXISTS "Service role can read contact messages" ON public.contact_messages;
CREATE POLICY "Service role can read contact messages"
ON public.contact_messages FOR SELECT
USING (is_service_role());

-- 8. conversion_goals - service role only
DROP POLICY IF EXISTS "Service role can manage conversion goals" ON public.conversion_goals;
CREATE POLICY "Service role can manage conversion goals"
ON public.conversion_goals FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 9. edr_ml_models - authenticated read
DROP POLICY IF EXISTS "Everyone can read ML models" ON public.edr_ml_models;
CREATE POLICY "Authenticated users can read ML models"
ON public.edr_ml_models FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 10. email_automation_log - service role only
DROP POLICY IF EXISTS "Service role only" ON public.email_automation_log;
CREATE POLICY "Service role can manage email automation log"
ON public.email_automation_log FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 11. funnel_events - service role only
DROP POLICY IF EXISTS "Service role can manage funnel events" ON public.funnel_events;
CREATE POLICY "Service role can manage funnel events"
ON public.funnel_events FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 12. helpdesk_canned_responses - authenticated read
DROP POLICY IF EXISTS "Only authenticated users can view canned responses" ON public.helpdesk_canned_responses;
CREATE POLICY "Authenticated users can view canned responses"
ON public.helpdesk_canned_responses FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 13. helpdesk_issue_patterns - authenticated read
DROP POLICY IF EXISTS "Authenticated users can view issue patterns" ON public.helpdesk_issue_patterns;
CREATE POLICY "Authenticated users can view issue patterns"
ON public.helpdesk_issue_patterns FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 14. pentest_remediation_playbooks - no user_id, reference data
DROP POLICY IF EXISTS "Authenticated users can view playbooks" ON public.pentest_remediation_playbooks;
CREATE POLICY "Authenticated users can view playbooks"
ON public.pentest_remediation_playbooks FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 15. pricing_plans - public read OK
DROP POLICY IF EXISTS "Authenticated users can read pricing plans" ON public.pricing_plans;
CREATE POLICY "Anyone can read pricing plans"
ON public.pricing_plans FOR SELECT
USING (true);

-- 16. rmm_patches - user ownership
DROP POLICY IF EXISTS "Users can view all patches" ON public.rmm_patches;
CREATE POLICY "Users can view their own patches"
ON public.rmm_patches FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 17. rmm_policies - user ownership
DROP POLICY IF EXISTS "Users can view all policies" ON public.rmm_policies;
CREATE POLICY "Users can view their own policies"
ON public.rmm_policies FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 18. safepass_breach_database - authenticated read
DROP POLICY IF EXISTS "spbd_select" ON public.safepass_breach_database;
CREATE POLICY "Authenticated users can view breach database"
ON public.safepass_breach_database FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 19. safeweb_sources - remove duplicates
DROP POLICY IF EXISTS "Only authenticated users can view safeweb sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Only authenticated users can view threat sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "sws_select" ON public.safeweb_sources;
CREATE POLICY "Authenticated users can view safeweb sources"
ON public.safeweb_sources FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- 20. subscription_grace_periods - service role
DROP POLICY IF EXISTS "Service role manages grace periods" ON public.subscription_grace_periods;
CREATE POLICY "Service role manages grace periods"
ON public.subscription_grace_periods FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 21. threat_intelligence_feeds - no user_id, reference data
DROP POLICY IF EXISTS "Service role manages threat intelligence" ON public.threat_intelligence_feeds;
DROP POLICY IF EXISTS "Users can view threat intelligence feeds" ON public.threat_intelligence_feeds;
CREATE POLICY "Authenticated users can view threat intelligence feeds"
ON public.threat_intelligence_feeds FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role manages threat intelligence"
ON public.threat_intelligence_feeds FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());

-- 22. vanguard_ticket_sla_tracking - service role for management
DROP POLICY IF EXISTS "Users can manage own SLA tracking" ON public.vanguard_ticket_sla_tracking;
CREATE POLICY "Service role can manage SLA tracking"
ON public.vanguard_ticket_sla_tracking FOR ALL
USING (is_service_role())
WITH CHECK (is_service_role());