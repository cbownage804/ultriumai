-- Remove duplicate/insecure policies that use email matching or are redundant
DROP POLICY IF EXISTS "subscribers_select_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_insert_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_update_own" ON public.subscribers;
DROP POLICY IF EXISTS "deny_anon_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_admin_all" ON public.subscribers;

-- Recreate admin policy with proper security (using security definer function)
CREATE POLICY "subscribers_admin_all"
ON public.subscribers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));