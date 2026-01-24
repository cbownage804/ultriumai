-- =============================================
-- FIX 1: Harden business_customers table RLS
-- =============================================

ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "business_customers_select_policy" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_insert_policy" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_update_policy" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_delete_policy" ON public.business_customers;
DROP POLICY IF EXISTS "Users can view own business customers" ON public.business_customers;

-- Strict owner-only policies
CREATE POLICY "business_customers_select_owner"
ON public.business_customers FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "business_customers_insert_owner"
ON public.business_customers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_customers_update_owner"
ON public.business_customers FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_customers_delete_owner"
ON public.business_customers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Block anon
CREATE POLICY "business_customers_block_anon"
ON public.business_customers FOR SELECT TO anon
USING (false);

REVOKE ALL ON public.business_customers FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_customers TO authenticated;

-- =============================================
-- FIX 2: Further harden client_portal_users
-- =============================================

ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean state
DROP POLICY IF EXISTS "block_all_direct_select" ON public.client_portal_users;
DROP POLICY IF EXISTS "block_anon_select" ON public.client_portal_users;
DROP POLICY IF EXISTS "block_direct_insert" ON public.client_portal_users;
DROP POLICY IF EXISTS "block_direct_update" ON public.client_portal_users;
DROP POLICY IF EXISTS "block_direct_delete" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_select_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_insert_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_update_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_delete_policy" ON public.client_portal_users;

-- COMPLETE LOCKDOWN - No direct access for any role except service_role
-- All operations must go through edge functions using service_role
CREATE POLICY "client_portal_users_deny_all_select"
ON public.client_portal_users FOR SELECT TO authenticated
USING (false);

CREATE POLICY "client_portal_users_deny_anon_select"
ON public.client_portal_users FOR SELECT TO anon
USING (false);

CREATE POLICY "client_portal_users_deny_all_insert"
ON public.client_portal_users FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "client_portal_users_deny_all_update"
ON public.client_portal_users FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "client_portal_users_deny_all_delete"
ON public.client_portal_users FOR DELETE TO authenticated
USING (false);

-- Revoke everything from public/anon - only service_role can access
REVOKE ALL ON public.client_portal_users FROM public, anon, authenticated;

-- Ensure safe view is the ONLY way to read non-sensitive data
DROP VIEW IF EXISTS public.client_portal_users_safe;
CREATE VIEW public.client_portal_users_safe 
WITH (security_invoker = on) AS
SELECT 
  id,
  client_id,
  email,
  full_name,
  role,
  is_active,
  last_login_at,
  created_at,
  updated_at
  -- EXCLUDED: password_hash, reset_token, reset_token_expires_at
FROM public.client_portal_users;

REVOKE ALL ON public.client_portal_users_safe FROM public, anon;
GRANT SELECT ON public.client_portal_users_safe TO authenticated;