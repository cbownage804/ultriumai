-- Drop conflicting and redundant RLS policies on profiles
DROP POLICY IF EXISTS "profiles_block_anon" ON public.profiles;
DROP POLICY IF EXISTS "Users can only manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own_only" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Create clean, non-conflicting policies that check user_id
CREATE POLICY "profiles_owner_select"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "profiles_owner_insert"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_owner_update"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_owner_delete"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);