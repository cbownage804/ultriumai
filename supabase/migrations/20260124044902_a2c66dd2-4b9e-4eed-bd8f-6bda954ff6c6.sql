-- =============================================
-- FIX 1: PROFILES TABLE - Remove any remaining broad access policies
-- =============================================

-- Drop any remaining policies that might allow broad access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- =============================================
-- FIX 2: PASSWORD_ENTRIES TABLE - Strict owner-only access
-- =============================================
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.password_entries;
DROP POLICY IF EXISTS "Public read access" ON public.password_entries;
DROP POLICY IF EXISTS "Users can view password entries" ON public.password_entries;
DROP POLICY IF EXISTS "Users can manage password entries" ON public.password_entries;

-- Create strict owner-only policies for password_entries
CREATE POLICY "password_entries_select_own"
ON public.password_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "password_entries_insert_own"
ON public.password_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "password_entries_update_own"
ON public.password_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "password_entries_delete_own"
ON public.password_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);