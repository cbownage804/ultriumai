-- Fix repeating security findings: lock down profiles + payment_transactions
-- Goal: remove any RLS policies that apply to the `public` role and simplify overlapping policies.

BEGIN;

/* =========================
   profiles
   ========================= */
-- Remove any legacy/duplicate policies (safe to run repeatedly)
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only manage their own profile" ON public.profiles;

-- Replace existing owner policies that were mistakenly scoped TO public
DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_delete ON public.profiles;

-- Recreate as authenticated-only
CREATE POLICY profiles_owner_select
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY profiles_owner_insert
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_owner_update
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_owner_delete
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


/* =========================
   payment_transactions
   ========================= */
-- Drop all existing overlapping / public-scoped policies (safe to run repeatedly)
DROP POLICY IF EXISTS "UltriumAI employees can manage transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "UltriumAI employees can view all transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can manage their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can update their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;

DROP POLICY IF EXISTS payment_tx_block_anon ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_select_owner_only ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_insert_owner_only ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_update_owner_only ON public.payment_transactions;
DROP POLICY IF EXISTS payment_tx_delete_owner_only ON public.payment_transactions;

DROP POLICY IF EXISTS pt_block_anon_select ON public.payment_transactions;
DROP POLICY IF EXISTS pt_block_anon_insert ON public.payment_transactions;
DROP POLICY IF EXISTS pt_select_owner_only ON public.payment_transactions;
DROP POLICY IF EXISTS pt_select_owner ON public.payment_transactions;
DROP POLICY IF EXISTS pt_insert_owner_only ON public.payment_transactions;
DROP POLICY IF EXISTS pt_insert_owner ON public.payment_transactions;
DROP POLICY IF EXISTS pt_update_owner_only ON public.payment_transactions;
DROP POLICY IF EXISTS pt_delete_owner_only ON public.payment_transactions;

-- Minimal, clear owner-only policies
CREATE POLICY payment_transactions_owner_select
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY payment_transactions_owner_insert
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY payment_transactions_owner_update
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY payment_transactions_owner_delete
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Optional: internal UltriumAI employee access (authenticated only)
-- Note: relies on existing is_ultrium_employee(uuid) function.
CREATE POLICY payment_transactions_employee_select_all
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (is_ultrium_employee(auth.uid()));

CREATE POLICY payment_transactions_employee_manage_all
ON public.payment_transactions
FOR ALL
TO authenticated
USING (is_ultrium_employee(auth.uid()))
WITH CHECK (is_ultrium_employee(auth.uid()));

COMMIT;