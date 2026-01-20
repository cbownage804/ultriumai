-- Fix 1: Ensure client_portal_users table has proper RLS
-- The table should have RLS enabled with restricted access

-- Enable RLS if not already enabled
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Anyone can view client portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Public read access" ON public.client_portal_users;

-- Ensure the deny policy exists and is restrictive
DROP POLICY IF EXISTS "No direct select on client_portal_users" ON public.client_portal_users;

-- Create a view that excludes sensitive columns for safe querying
CREATE OR REPLACE VIEW public.client_portal_users_safe
WITH (security_invoker=on) AS
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
  -- Excludes: password_hash, reset_token, reset_token_expires_at
FROM public.client_portal_users;

-- Base table: Only allow access via specific authenticated operations
-- No direct SELECT - must use the safe view or edge functions
CREATE POLICY "Deny direct select on client_portal_users"
ON public.client_portal_users
FOR SELECT
TO authenticated
USING (false);

-- Allow users to insert their own records (for registration via edge functions)
CREATE POLICY "Service role can manage client_portal_users"
ON public.client_portal_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 2: Secure the api_keys table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any permissive policies
DROP POLICY IF EXISTS "Anyone can view api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Public read access" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;

-- Create strict policies: users can only access their own API keys
CREATE POLICY "Users can view own API keys"
ON public.api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
ON public.api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
ON public.api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);