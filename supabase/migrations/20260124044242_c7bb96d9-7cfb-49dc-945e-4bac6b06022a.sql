-- Harden profiles table RLS - ensure users can only access their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create strict owner-only SELECT policy for profiles
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create strict owner-only management policy for profiles
CREATE POLICY "Users can only manage their own profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Harden payment_transactions table RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.payment_transactions;
DROP POLICY IF EXISTS "Public read access" ON public.payment_transactions;

-- Ensure strict owner-only access for payment_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.payment_transactions;

CREATE POLICY "Users can view their own payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment transactions"
ON public.payment_transactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);