-- Fix 1: Clean up ALL conflicting policies on client_portal_users and create clear deny-all for anon
DROP POLICY IF EXISTS "Users can only access own record" ON public.client_portal_users;
DROP POLICY IF EXISTS "Users can update their own password" ON public.client_portal_users;
DROP POLICY IF EXISTS "Allow password updates" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_select_policy" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_update_policy" ON public.client_portal_users;

-- Block all anonymous access completely
CREATE POLICY "Block anonymous access"
ON public.client_portal_users
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Authenticated users can only access their own record (by matching email or id)
CREATE POLICY "Authenticated users access own record only"
ON public.client_portal_users
FOR ALL
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR id::text = auth.uid()::text
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR id::text = auth.uid()::text
);

-- Fix 2: Add RESTRICTIVE policy to block anon from safepass tables
CREATE POLICY "Block anonymous safepass_entries access"
ON public.safepass_entries
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Also secure password_entries if not already
DROP POLICY IF EXISTS "Block anonymous password_entries" ON public.password_entries;
CREATE POLICY "Block anonymous password_entries"
ON public.password_entries
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);