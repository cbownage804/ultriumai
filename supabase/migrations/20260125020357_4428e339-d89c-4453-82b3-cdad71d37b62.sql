-- Harden msp_clients and payment_transactions tables

-- 1) msp_clients: revoke anon/public access, force RLS, consolidate policies to authenticated-only
ALTER TABLE public.msp_clients FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.msp_clients FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.msp_clients FROM public;

-- Drop duplicate/overlapping policies
DROP POLICY IF EXISTS "Admins can view all MSP clients" ON public.msp_clients;
DROP POLICY IF EXISTS "MSP owners can delete their own clients" ON public.msp_clients;
DROP POLICY IF EXISTS "MSP owners can insert their own clients" ON public.msp_clients;
DROP POLICY IF EXISTS "MSP owners can update their own clients" ON public.msp_clients;
DROP POLICY IF EXISTS "MSP owners can view their own clients" ON public.msp_clients;
DROP POLICY IF EXISTS "MSPs can manage their clients" ON public.msp_clients;
DROP POLICY IF EXISTS "UltriumAI employees can manage all MSP clients" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_delete_own" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_insert_own" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_select_own" ON public.msp_clients;
DROP POLICY IF EXISTS "msp_clients_update_own" ON public.msp_clients;

-- Create clean authenticated-only policies
CREATE POLICY "msp_clients_select_authenticated"
ON public.msp_clients
FOR SELECT
TO authenticated
USING (
  msp_id IN (
    SELECT msps.id FROM public.msps WHERE msps.user_id = auth.uid()
  )
  OR is_ultrium_employee(auth.uid())
);

CREATE POLICY "msp_clients_insert_authenticated"
ON public.msp_clients
FOR INSERT
TO authenticated
WITH CHECK (
  msp_id IN (
    SELECT msps.id FROM public.msps WHERE msps.user_id = auth.uid()
  )
  OR is_ultrium_employee(auth.uid())
);

CREATE POLICY "msp_clients_update_authenticated"
ON public.msp_clients
FOR UPDATE
TO authenticated
USING (
  msp_id IN (
    SELECT msps.id FROM public.msps WHERE msps.user_id = auth.uid()
  )
  OR is_ultrium_employee(auth.uid())
);

CREATE POLICY "msp_clients_delete_authenticated"
ON public.msp_clients
FOR DELETE
TO authenticated
USING (
  msp_id IN (
    SELECT msps.id FROM public.msps WHERE msps.user_id = auth.uid()
  )
  OR is_ultrium_employee(auth.uid())
);

-- 2) payment_transactions: force RLS and ensure anon has no access
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.payment_transactions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.payment_transactions FROM public;

-- Grant only to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.payment_transactions TO service_role;