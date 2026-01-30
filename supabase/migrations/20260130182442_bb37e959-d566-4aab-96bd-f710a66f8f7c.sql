-- Fix security vulnerability: client_portal_users table
-- Contains sensitive data including password hashes - restrict access

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "MSP owners can manage client portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Client portal users can view own data" ON public.client_portal_users;
DROP POLICY IF EXISTS "Users can view their own portal account" ON public.client_portal_users;

-- Create a safe view that excludes password_hash for application use
CREATE OR REPLACE VIEW public.client_portal_users_safe
WITH (security_invoker=on) AS
  SELECT id, client_id, email, full_name, role, is_active, last_login_at, created_at, updated_at
  FROM public.client_portal_users;
  -- Excludes: password_hash, reset_token, reset_token_expires_at

-- Deny direct SELECT access to base table (forces use of view or service role)
CREATE POLICY "Deny direct client portal user access"
ON public.client_portal_users FOR SELECT
TO authenticated
USING (false);

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role manages client portal users"
ON public.client_portal_users FOR ALL
USING (is_service_role()) WITH CHECK (is_service_role());

-- Fix security vulnerability: recon_orders table
-- Contains PII including phone numbers, addresses, payment info

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own recon orders" ON public.recon_orders;
DROP POLICY IF EXISTS "Users can create recon orders" ON public.recon_orders;
DROP POLICY IF EXISTS "Admins can view all recon orders" ON public.recon_orders;
DROP POLICY IF EXISTS "Service role manages recon orders" ON public.recon_orders;

-- Users can only view their own orders
CREATE POLICY "Users view own recon orders"
ON public.recon_orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users create own recon orders"
ON public.recon_orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (before fulfillment)
CREATE POLICY "Users update own recon orders"
ON public.recon_orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND order_status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all orders (for admin functions)
CREATE POLICY "Service role manages recon orders"
ON public.recon_orders FOR ALL
USING (is_service_role()) WITH CHECK (is_service_role());