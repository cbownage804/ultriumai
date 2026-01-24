-- =============================================
-- FIX 1: PROFILES TABLE - Ensure strict owner-only access
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Owner can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.profiles;

-- Create new strict owner-only policies
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- FIX 2: API_KEYS TABLE - Ensure strict owner-only access
-- =============================================
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can manage own api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Allow public read access" ON public.api_keys;

-- Create strict owner-only policies
CREATE POLICY "api_keys_select_own"
ON public.api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "api_keys_insert_own"
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_update_own"
ON public.api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_delete_own"
ON public.api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- FIX 3: BUSINESS_CUSTOMERS TABLE - Ensure strict owner-only access
-- =============================================
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own business customer records" ON public.business_customers;
DROP POLICY IF EXISTS "Users can manage their own business customer records" ON public.business_customers;
DROP POLICY IF EXISTS "Allow public read access" ON public.business_customers;

-- Create strict owner-only policies
CREATE POLICY "business_customers_select_own"
ON public.business_customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "business_customers_insert_own"
ON public.business_customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_customers_update_own"
ON public.business_customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_customers_delete_own"
ON public.business_customers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);