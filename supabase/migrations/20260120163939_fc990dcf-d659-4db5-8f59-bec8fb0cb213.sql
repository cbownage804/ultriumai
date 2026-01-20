-- Fix 1: Secure the profiles table by creating a view without sensitive fields
-- and restricting direct access

-- Create a public-safe view for profiles (excludes sensitive fields)
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  account_type,
  created_at,
  updated_at
FROM public.profiles;

-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create restrictive SELECT policy - users can only see their own profile
CREATE POLICY "Users can only view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix 2: Secure the client_portal_users table by creating a view without credentials

-- Create a safe view for client_portal_users (excludes password_hash, reset_token, etc.)
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
FROM public.client_portal_users;

-- Drop existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can view client portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Users can view client portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Authenticated users can view client portal users" ON public.client_portal_users;

-- Create restrictive SELECT policy - deny direct access, use the safe view instead
CREATE POLICY "No direct select on client_portal_users"
ON public.client_portal_users FOR SELECT
TO authenticated
USING (false);

-- Allow service role full access for backend operations
CREATE POLICY "Service role has full access to client_portal_users"
ON public.client_portal_users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Keep INSERT/UPDATE/DELETE policies for authenticated users who need to manage their own data
CREATE POLICY "Users can update their own client portal record"
ON public.client_portal_users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text::uuid OR client_id IN (
  SELECT client_id FROM public.client_users WHERE user_id = auth.uid()
));

-- Comment on views to document their purpose
COMMENT ON VIEW public.profiles_safe IS 'Public-safe view of profiles table, excludes sensitive PII fields like email, phone, stripe_customer_id';
COMMENT ON VIEW public.client_portal_users_safe IS 'Public-safe view of client_portal_users, excludes password_hash and reset_token fields';