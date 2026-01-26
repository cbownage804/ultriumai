-- =====================================================
-- PRODUCTION SECURITY HARDENING - CRITICAL FIXES PART 2
-- =====================================================

-- Drop and recreate anon denial policies (IF NOT EXISTS not supported for policies)

-- Deny anon to safepass_entries
DROP POLICY IF EXISTS "deny_anon_safepass_entries" ON public.safepass_entries;
CREATE POLICY "deny_anon_safepass_entries"
  ON public.safepass_entries
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to safepass_vaults  
DROP POLICY IF EXISTS "deny_anon_safepass_vaults" ON public.safepass_vaults;
CREATE POLICY "deny_anon_safepass_vaults"
  ON public.safepass_vaults
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to security_api_keys
DROP POLICY IF EXISTS "deny_anon_security_api_keys" ON public.security_api_keys;
CREATE POLICY "deny_anon_security_api_keys"
  ON public.security_api_keys
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to payment_transactions
DROP POLICY IF EXISTS "deny_anon_payment_transactions" ON public.payment_transactions;
CREATE POLICY "deny_anon_payment_transactions"
  ON public.payment_transactions
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to vanguard_agent_credentials
DROP POLICY IF EXISTS "deny_anon_vanguard_credentials" ON public.vanguard_agent_credentials;
CREATE POLICY "deny_anon_vanguard_credentials"
  ON public.vanguard_agent_credentials
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to api_keys
DROP POLICY IF EXISTS "deny_anon_api_keys" ON public.api_keys;
CREATE POLICY "deny_anon_api_keys"
  ON public.api_keys
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to admin_audit_trails
DROP POLICY IF EXISTS "deny_anon_admin_audit_trails" ON public.admin_audit_trails;
CREATE POLICY "deny_anon_admin_audit_trails"
  ON public.admin_audit_trails
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to user_roles
DROP POLICY IF EXISTS "deny_anon_user_roles" ON public.user_roles;
CREATE POLICY "deny_anon_user_roles"
  ON public.user_roles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to msp_clients (contains business data)
DROP POLICY IF EXISTS "deny_anon_msp_clients" ON public.msp_clients;
CREATE POLICY "deny_anon_msp_clients"
  ON public.msp_clients
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Deny anon to business_customers
DROP POLICY IF EXISTS "deny_anon_business_customers" ON public.business_customers;
CREATE POLICY "deny_anon_business_customers"
  ON public.business_customers
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);