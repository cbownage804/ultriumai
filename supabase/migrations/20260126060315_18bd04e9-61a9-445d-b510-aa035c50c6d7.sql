-- =====================================================
-- CLEANUP: Remove duplicate policies and fix role targeting
-- =====================================================

-- SECURITY_API_KEYS: Remove duplicates
DROP POLICY IF EXISTS "Block anonymous access to security_api_keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_delete_owner" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_insert_owner" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_select_owner" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_update_owner" ON public.security_api_keys;

-- USER_ACTIVITY_LOGS: Fix policies targeting 'public' role
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.user_activity_logs;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.user_activity_logs;

-- Recreate with authenticated role only
CREATE POLICY "authenticated_view_own_activity"
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_current_user_admin());

-- Add anon denial
DROP POLICY IF EXISTS "deny_anon_user_activity_logs" ON public.user_activity_logs;
CREATE POLICY "deny_anon_user_activity_logs"
  ON public.user_activity_logs
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);