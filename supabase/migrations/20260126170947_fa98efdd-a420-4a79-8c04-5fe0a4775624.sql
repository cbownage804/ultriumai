-- Recreate the view with security_invoker to enforce RLS
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
FROM public.client_portal_users;

-- Grant access to authenticated users only (view will respect underlying RLS)
REVOKE ALL ON public.client_portal_users_safe FROM anon;
GRANT SELECT ON public.client_portal_users_safe TO authenticated;

-- Add proper SELECT policy for the base table that the view will use
DROP POLICY IF EXISTS "Deny direct select - use safe view" ON public.client_portal_users;

CREATE POLICY "Authenticated users can view client portal users they manage"
ON public.client_portal_users FOR SELECT
TO authenticated
USING (
  -- User can see their own record
  id = auth.uid()
  OR
  -- MSP owners can see users of their clients
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON mc.msp_id = m.id
    WHERE mc.id = client_portal_users.client_id
    AND m.user_id = auth.uid()
  )
  OR
  -- MSP staff can see users of clients they manage
  EXISTS (
    SELECT 1 FROM public.msp_staff ms
    JOIN public.msp_clients mc ON mc.msp_id = ms.msp_id
    WHERE mc.id = client_portal_users.client_id
    AND ms.user_id = auth.uid()
    AND ms.is_active = true
  )
  OR
  -- Client users can see other users in their same client
  EXISTS (
    SELECT 1 FROM public.client_portal_users cpu
    WHERE cpu.id = auth.uid()
    AND cpu.client_id = client_portal_users.client_id
    AND cpu.is_active = true
  )
);