-- =============================================
-- FIX 1: Harden api_keys table RLS
-- =============================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update_own" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_own" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can manage own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_block_anon" ON public.api_keys;

-- Strict owner-only policies
CREATE POLICY "api_keys_select_owner_only"
ON public.api_keys FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "api_keys_insert_owner_only"
ON public.api_keys FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_update_owner_only"
ON public.api_keys FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_delete_owner_only"
ON public.api_keys FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Block anon
CREATE POLICY "api_keys_block_anon"
ON public.api_keys FOR SELECT TO anon
USING (false);

REVOKE ALL ON public.api_keys FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;

-- =============================================
-- FIX 2: Ensure payment_transactions is locked down
-- =============================================

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Clean slate
DROP POLICY IF EXISTS "payment_transactions_select_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_delete_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_block_anon" ON public.payment_transactions;

CREATE POLICY "payment_tx_select_owner_only"
ON public.payment_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "payment_tx_insert_owner_only"
ON public.payment_transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_tx_update_owner_only"
ON public.payment_transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_tx_delete_owner_only"
ON public.payment_transactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "payment_tx_block_anon"
ON public.payment_transactions FOR SELECT TO anon
USING (false);

REVOKE ALL ON public.payment_transactions FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;