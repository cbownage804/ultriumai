-- =============================================
-- FIX 1: Harden payment_transactions table RLS
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can update own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_select_policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_delete_policy" ON public.payment_transactions;

-- Create strict RLS policies for authenticated users only
CREATE POLICY "payment_transactions_select_own"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "payment_transactions_insert_own"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_transactions_update_own"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_transactions_delete_own"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Revoke direct access from public/anon
REVOKE ALL ON public.payment_transactions FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;

-- =============================================
-- FIX 2: Harden client_portal_users table RLS
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be too permissive
DROP POLICY IF EXISTS "client_portal_users_select_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_insert_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_update_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_delete_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "Users can view client portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Deny direct SELECT on client_portal_users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Block all direct access to client_portal_users" ON public.client_portal_users;

-- CRITICAL: Block ALL direct access to the table with sensitive data
-- All legitimate access MUST go through the client_portal_users_safe view
CREATE POLICY "block_all_direct_select"
ON public.client_portal_users
FOR SELECT
TO authenticated
USING (false);

CREATE POLICY "block_anon_select"
ON public.client_portal_users
FOR SELECT
TO anon
USING (false);

-- Only allow inserts via service role (edge functions)
CREATE POLICY "block_direct_insert"
ON public.client_portal_users
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Only allow updates via service role (edge functions)
CREATE POLICY "block_direct_update"
ON public.client_portal_users
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Only allow deletes via service role (edge functions)
CREATE POLICY "block_direct_delete"
ON public.client_portal_users
FOR DELETE
TO authenticated
USING (false);

-- Revoke all direct access
REVOKE ALL ON public.client_portal_users FROM public, anon;

-- Ensure the safe view exists and is properly secured
CREATE OR REPLACE VIEW public.client_portal_users_safe 
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
  -- Explicitly EXCLUDE: password_hash, reset_token, reset_token_expires_at
FROM public.client_portal_users;

-- Secure the safe view
REVOKE ALL ON public.client_portal_users_safe FROM public, anon;
GRANT SELECT ON public.client_portal_users_safe TO authenticated;