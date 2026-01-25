-- Drop the existing view and recreate with security_invoker
DROP VIEW IF EXISTS public.client_portal_users_safe;

-- Recreate view with security_invoker to respect base table RLS
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
FROM public.client_portal_users;

-- Revoke all access from anon and public roles
REVOKE ALL ON public.client_portal_users_safe FROM anon, public;

-- Grant access only to authenticated users
GRANT SELECT ON public.client_portal_users_safe TO authenticated;

-- Also ensure the base table has proper RLS
-- Block anonymous access to base table
DROP POLICY IF EXISTS "Block anonymous access to client_portal_users" ON public.client_portal_users;
CREATE POLICY "Block anonymous access to client_portal_users"
ON public.client_portal_users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke direct access from anon/public on base table
REVOKE ALL ON public.client_portal_users FROM anon, public;