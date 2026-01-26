-- Create a security definer function for MSP ownership check
-- This prevents any potential subquery timing attacks and ensures proper isolation

CREATE OR REPLACE FUNCTION public.user_owns_msp(_msp_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.msps
    WHERE id = _msp_id AND user_id = auth.uid()
  )
$$;

-- Drop existing policies and recreate with the security definer function
DROP POLICY IF EXISTS "msp_clients_select_authenticated" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_insert_authenticated" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_update_authenticated" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_delete_authenticated" ON public.msp_clients;

-- Recreate with cleaner, more secure policies using the function
CREATE POLICY "msp_clients_select_own"
ON public.msp_clients FOR SELECT
TO authenticated
USING (user_owns_msp(msp_id) OR is_ultrium_employee(auth.uid()));

CREATE POLICY "msp_clients_insert_own"
ON public.msp_clients FOR INSERT
TO authenticated
WITH CHECK (user_owns_msp(msp_id) OR is_ultrium_employee(auth.uid()));

CREATE POLICY "msp_clients_update_own"
ON public.msp_clients FOR UPDATE
TO authenticated
USING (user_owns_msp(msp_id) OR is_ultrium_employee(auth.uid()))
WITH CHECK (user_owns_msp(msp_id) OR is_ultrium_employee(auth.uid()));

CREATE POLICY "msp_clients_delete_own"
ON public.msp_clients FOR DELETE
TO authenticated
USING (user_owns_msp(msp_id) OR is_ultrium_employee(auth.uid()));

-- Ensure anon is blocked
REVOKE ALL ON public.msp_clients FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_clients TO authenticated;

COMMENT ON FUNCTION public.user_owns_msp(uuid) IS 
  'Security definer function to check if current user owns the specified MSP. Used for RLS policy isolation.';