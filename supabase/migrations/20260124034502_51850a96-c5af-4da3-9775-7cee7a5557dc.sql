-- =============================================
-- FIX 1: Harden profiles table RLS
-- =============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to replace with strict ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Create strict RLS policies - users can ONLY access their own profile
CREATE POLICY "profiles_select_own_only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own_only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own_only"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Block anon access completely
CREATE POLICY "profiles_block_anon"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Revoke public/anon access
REVOKE ALL ON public.profiles FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- =============================================
-- FIX 2: Verify and strengthen payment_transactions RLS
-- =============================================

-- Make sure RLS is enabled
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "payment_transactions_select_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_own" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_delete_own" ON public.payment_transactions;

-- Recreate strict policies
CREATE POLICY "payment_transactions_select_own"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "payment_transactions_insert_own"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_transactions_update_own"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_transactions_delete_own"
ON public.payment_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Block anon access
DROP POLICY IF EXISTS "payment_transactions_block_anon" ON public.payment_transactions;
CREATE POLICY "payment_transactions_block_anon"
ON public.payment_transactions
FOR SELECT
TO anon
USING (false);

-- Ensure permissions are correct
REVOKE ALL ON public.payment_transactions FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;