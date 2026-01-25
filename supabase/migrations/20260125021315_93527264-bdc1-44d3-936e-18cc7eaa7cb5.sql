-- =============================================
-- SECURITY HARDENING: Final Fixes
-- =============================================

-- 1) user_activity_logs: revoke anon access, prevent user modification, force RLS
ALTER TABLE public.user_activity_logs FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.user_activity_logs FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_activity_logs FROM public;

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert activity logs" ON public.user_activity_logs;

-- Users cannot modify/delete their own logs (audit trail integrity)
DROP POLICY IF EXISTS "Users can delete own activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Users can update own activity logs" ON public.user_activity_logs;

-- Create restrictive policies
CREATE POLICY "ual_select_own"
ON public.user_activity_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_current_user_admin());

-- Only service_role can insert (via edge functions/triggers)
CREATE POLICY "ual_insert_service_role"
ON public.user_activity_logs FOR INSERT TO service_role
WITH CHECK (true);

-- Grant only SELECT to authenticated, full access to service_role
GRANT SELECT ON public.user_activity_logs TO authenticated;
GRANT ALL PRIVILEGES ON public.user_activity_logs TO service_role;

-- 2) client_portal_users_safe: restore SELECT for authenticated
GRANT SELECT ON public.client_portal_users_safe TO authenticated;

-- 3) api_keys: consolidate duplicate policies, force RLS, revoke public
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.api_keys FROM public;

-- Drop all duplicate policies for clean slate
DROP POLICY IF EXISTS "Users can create own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "ak_delete_owner" ON public.api_keys;
DROP POLICY IF EXISTS "ak_insert_owner" ON public.api_keys;
DROP POLICY IF EXISTS "ak_select_owner" ON public.api_keys;
DROP POLICY IF EXISTS "ak_update_owner" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_block_anon" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_owner_only" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_owner_only" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_select_owner_only" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update_owner_only" ON public.api_keys;

-- Create clean owner-only policies
CREATE POLICY "api_keys_owner_select"
ON public.api_keys FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "api_keys_owner_insert"
ON public.api_keys FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_owner_update"
ON public.api_keys FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_owner_delete"
ON public.api_keys FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Ensure anon is blocked
CREATE POLICY "api_keys_deny_anon"
ON public.api_keys FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- 4) msp_clients / payment_transactions: ensure public role has no access
REVOKE ALL PRIVILEGES ON TABLE public.msp_clients FROM public;
REVOKE ALL PRIVILEGES ON TABLE public.payment_transactions FROM public;