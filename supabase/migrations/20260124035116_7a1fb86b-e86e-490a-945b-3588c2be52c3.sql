-- Ensure business_customers is fully locked down
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for clean slate
DROP POLICY IF EXISTS "business_customers_select_owner" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_insert_owner" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_update_owner" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_delete_owner" ON public.business_customers;
DROP POLICY IF EXISTS "business_customers_block_anon" ON public.business_customers;

-- Strict owner-only access
CREATE POLICY "bc_select_owner_only"
ON public.business_customers FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "bc_insert_owner_only"
ON public.business_customers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bc_update_owner_only"
ON public.business_customers FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bc_delete_owner_only"
ON public.business_customers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Block anon completely
CREATE POLICY "bc_block_anon_select"
ON public.business_customers FOR SELECT TO anon
USING (false);

CREATE POLICY "bc_block_anon_insert"
ON public.business_customers FOR INSERT TO anon
WITH CHECK (false);

-- Revoke all from public/anon
REVOKE ALL ON public.business_customers FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_customers TO authenticated;