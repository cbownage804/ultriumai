-- 1. Revoke anon/public direct access to sensitive tables (belt-and-suspenders)
REVOKE ALL ON public.profiles FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

REVOKE ALL ON public.security_api_keys FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_api_keys TO authenticated;

-- 2. Drop duplicate/redundant policies on security_api_keys (keep only the specific CRUD ones)
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "Users can manage their own security API keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "Users can view their own security API keys" ON public.security_api_keys;

-- Ensure remaining policies have explicit WITH CHECK for update
DROP POLICY IF EXISTS "sak_update_owner" ON public.security_api_keys;
CREATE POLICY "sak_update_owner" ON public.security_api_keys
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);