
-- Clean up duplicate/redundant policies on business_customers
-- Keep only the properly named ones

DROP POLICY IF EXISTS "Admins can view all business customers" ON public.business_customers;
DROP POLICY IF EXISTS "Users can manage their own business account" ON public.business_customers;
DROP POLICY IF EXISTS "bc_block_anon_insert" ON public.business_customers;
DROP POLICY IF EXISTS "bc_block_anon_select" ON public.business_customers;
DROP POLICY IF EXISTS "bc_delete_owner_only" ON public.business_customers;
DROP POLICY IF EXISTS "bc_insert_owner" ON public.business_customers;
DROP POLICY IF EXISTS "bc_insert_owner_only" ON public.business_customers;
DROP POLICY IF EXISTS "bc_select_owner" ON public.business_customers;
DROP POLICY IF EXISTS "bc_select_owner_only" ON public.business_customers;
DROP POLICY IF EXISTS "bc_update_owner" ON public.business_customers;
DROP POLICY IF EXISTS "bc_update_owner_only" ON public.business_customers;

-- Keep only these 4 properly named policies:
-- business_customers_select_own
-- business_customers_insert_own
-- business_customers_update_own
-- business_customers_delete_own
