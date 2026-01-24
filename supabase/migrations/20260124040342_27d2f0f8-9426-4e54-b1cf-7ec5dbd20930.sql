-- Ensure payment_transactions has strict RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "payment_transactions_select_owner" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_owner" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_owner" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_delete_owner" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.payment_transactions;

-- Strict owner-only access for authenticated users
CREATE POLICY "pt_select_owner_only"
ON public.payment_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "pt_insert_owner_only"
ON public.payment_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pt_update_owner_only"
ON public.payment_transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pt_delete_owner_only"
ON public.payment_transactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Block anonymous access completely
CREATE POLICY "pt_block_anon_select"
ON public.payment_transactions FOR SELECT TO anon
USING (false);

CREATE POLICY "pt_block_anon_insert"
ON public.payment_transactions FOR INSERT TO anon
WITH CHECK (false);

-- Revoke all from public/anon and grant only to authenticated
REVOKE ALL ON public.payment_transactions FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;