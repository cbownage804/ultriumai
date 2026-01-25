-- Fix remaining overly permissive RLS policies

-- 1. Fix security_alerts - should be service_role only
DROP POLICY IF EXISTS "System can insert security alerts" ON public.security_alerts;

CREATE POLICY "Service role can insert security alerts"
ON public.security_alerts FOR INSERT TO service_role
WITH CHECK (true);

-- 2. Fix security_app_subscriptions - should be service_role only for system updates
DROP POLICY IF EXISTS "System can update security app subscriptions" ON public.security_app_subscriptions;

CREATE POLICY "Service role can update security app subscriptions"
ON public.security_app_subscriptions FOR UPDATE TO service_role
USING (true);

-- 3. Fix security_events - should be service_role only
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

CREATE POLICY "Service role can insert security events"
ON public.security_events FOR INSERT TO service_role
WITH CHECK (true);

-- 4. Fix system_health_metrics - should be service_role only
DROP POLICY IF EXISTS "System can insert health metrics" ON public.system_health_metrics;

CREATE POLICY "Service role can insert health metrics"
ON public.system_health_metrics FOR INSERT TO service_role
WITH CHECK (true);

-- 5. Fix user_credits - should be service_role only for system operations
DROP POLICY IF EXISTS "insert_credits" ON public.user_credits;
DROP POLICY IF EXISTS "update_credits" ON public.user_credits;

CREATE POLICY "Service role can insert credits"
ON public.user_credits FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update credits"
ON public.user_credits FOR UPDATE TO service_role
USING (true);

-- Keep user read access
CREATE POLICY "Users can view own credits"
ON public.user_credits FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 6. Fix vanguard_agent_commands - should be service_role only
DROP POLICY IF EXISTS "System can update command status" ON public.vanguard_agent_commands;

CREATE POLICY "Service role can update agent commands"
ON public.vanguard_agent_commands FOR UPDATE TO service_role
USING (true);

-- 7. Fix vanguard_agent_metrics - should be service_role only
DROP POLICY IF EXISTS "System can insert metrics" ON public.vanguard_agent_metrics;

CREATE POLICY "Service role can insert agent metrics"
ON public.vanguard_agent_metrics FOR INSERT TO service_role
WITH CHECK (true);