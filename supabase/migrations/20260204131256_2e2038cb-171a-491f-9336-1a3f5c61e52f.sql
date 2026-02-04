-- Step 2: Create security definer function to get customer IDs for co-managed access
CREATE OR REPLACE FUNCTION public.get_comanaged_customer_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get customer IDs through the comanaged_organizations -> msp_clients -> rmm_customers chain
  SELECT DISTINCT rc.id
  FROM public.comanaged_technician_access cta
  INNER JOIN public.comanaged_organizations co ON co.id = cta.organization_id
  INNER JOIN public.msp_clients mc ON mc.id = co.client_id
  INNER JOIN public.rmm_customers rc ON rc.client_id = mc.id
  WHERE cta.technician_id = _user_id
$$;

-- Step 3: Create RLS policies for helpdesk_tickets with co-managed access
DROP POLICY IF EXISTS "Admins can manage all helpdesk tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can view tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can update tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can delete tickets" ON public.helpdesk_tickets;

CREATE POLICY "Users can view tickets" 
ON public.helpdesk_tickets 
FOR SELECT 
TO authenticated
USING (
  -- Owner: user owns the customer record
  customer_id IN (SELECT id FROM rmm_customers WHERE user_id = auth.uid())
  -- Co-managed: tech has access to the customer's org
  OR customer_id IN (SELECT get_comanaged_customer_ids(auth.uid()))
  -- Admin bypass
  OR is_admin_user()
);

CREATE POLICY "Users can update tickets" 
ON public.helpdesk_tickets 
FOR UPDATE 
TO authenticated
USING (
  customer_id IN (SELECT id FROM rmm_customers WHERE user_id = auth.uid())
  OR customer_id IN (SELECT get_comanaged_customer_ids(auth.uid()))
  OR is_admin_user()
);

CREATE POLICY "Users can insert tickets" 
ON public.helpdesk_tickets 
FOR INSERT 
TO authenticated
WITH CHECK (
  customer_id IN (SELECT id FROM rmm_customers WHERE user_id = auth.uid())
  OR is_admin_user()
);

CREATE POLICY "Users can delete tickets" 
ON public.helpdesk_tickets 
FOR DELETE 
TO authenticated
USING (
  customer_id IN (SELECT id FROM rmm_customers WHERE user_id = auth.uid())
  OR is_admin_user()
);

-- Step 4: Also update vanguard_agents to use client_id for co-managed access
CREATE OR REPLACE FUNCTION public.get_comanaged_client_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT co.client_id
  FROM public.comanaged_organizations co
  INNER JOIN public.comanaged_technician_access cta ON cta.organization_id = co.id
  WHERE cta.technician_id = _user_id
    AND co.client_id IS NOT NULL
$$;

-- Update vanguard_agents RLS
DROP POLICY IF EXISTS "authenticated_view_own_agents" ON public.vanguard_agents;
DROP POLICY IF EXISTS "authenticated_update_own_agents" ON public.vanguard_agents;
DROP POLICY IF EXISTS "authenticated_delete_own_agents" ON public.vanguard_agents;

CREATE POLICY "authenticated_view_own_agents" 
ON public.vanguard_agents 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR client_id IN (SELECT get_comanaged_client_ids(auth.uid()))
  OR is_admin_user()
);

CREATE POLICY "authenticated_update_own_agents" 
ON public.vanguard_agents 
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid() 
  OR client_id IN (SELECT get_comanaged_client_ids(auth.uid()))
);

CREATE POLICY "authenticated_delete_own_agents" 
ON public.vanguard_agents 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());