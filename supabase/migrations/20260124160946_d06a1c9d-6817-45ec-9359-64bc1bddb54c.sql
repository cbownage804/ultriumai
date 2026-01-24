-- =====================================================
-- FIX: Consolidate password_entries and safepass_entries RLS
-- Remove overly permissive policies, enforce strict owner-only access
-- =====================================================

-- Drop ALL existing policies on password_entries (conflicting duplicates)
DROP POLICY IF EXISTS "password_entries_delete_own" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_delete_policy" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_insert_own" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_insert_policy" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_select_own" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_select_policy" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_update_own" ON public.password_entries;
DROP POLICY IF EXISTS "password_entries_update_policy" ON public.password_entries;
DROP POLICY IF EXISTS "pe_delete_owner_only" ON public.password_entries;
DROP POLICY IF EXISTS "pe_deny_anon_all" ON public.password_entries;
DROP POLICY IF EXISTS "pe_insert_owner_only" ON public.password_entries;
DROP POLICY IF EXISTS "pe_select_owner_or_shared" ON public.password_entries;
DROP POLICY IF EXISTS "pe_update_owner_only" ON public.password_entries;

-- Drop ALL existing policies on safepass_entries
DROP POLICY IF EXISTS "safepass_entries_delete_policy" ON public.safepass_entries;
DROP POLICY IF EXISTS "safepass_entries_insert_policy" ON public.safepass_entries;
DROP POLICY IF EXISTS "safepass_entries_select_policy" ON public.safepass_entries;
DROP POLICY IF EXISTS "safepass_entries_update_policy" ON public.safepass_entries;

-- =====================================================
-- password_entries: STRICT OWNER-ONLY POLICIES
-- =====================================================

-- Block anonymous access completely
CREATE POLICY "password_entries_block_anon"
ON public.password_entries
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- SELECT: Owner only (NO shared access - too risky for passwords)
CREATE POLICY "password_entries_select_owner_only"
ON public.password_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Owner only
CREATE POLICY "password_entries_insert_owner_only"
ON public.password_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Owner only
CREATE POLICY "password_entries_update_owner_only"
ON public.password_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Owner only
CREATE POLICY "password_entries_delete_owner_only"
ON public.password_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- safepass_entries: STRICT OWNER-ONLY POLICIES
-- =====================================================

-- Block anonymous access completely
CREATE POLICY "safepass_entries_block_anon"
ON public.safepass_entries
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- SELECT: Owner only
CREATE POLICY "safepass_entries_select_owner_only"
ON public.safepass_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Owner only
CREATE POLICY "safepass_entries_insert_owner_only"
ON public.safepass_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Owner only
CREATE POLICY "safepass_entries_update_owner_only"
ON public.safepass_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Owner only
CREATE POLICY "safepass_entries_delete_owner_only"
ON public.safepass_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);