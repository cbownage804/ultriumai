-- =============================================
-- 1. HARDEN client_portal_users - block all direct access
-- =============================================
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for clean slate
DROP POLICY IF EXISTS "client_portal_users_deny_all_select" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_deny_anon_select" ON public.client_portal_users;
DROP POLICY IF EXISTS "MSPs can manage their clients portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_select_owner" ON public.client_portal_users;

-- Complete lockdown - deny ALL direct access to authenticated users
-- Only service_role can access this table directly
CREATE POLICY "cpu_deny_authenticated_select"
ON public.client_portal_users FOR SELECT TO authenticated
USING (false);

CREATE POLICY "cpu_deny_authenticated_insert"
ON public.client_portal_users FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "cpu_deny_authenticated_update"
ON public.client_portal_users FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "cpu_deny_authenticated_delete"
ON public.client_portal_users FOR DELETE TO authenticated
USING (false);

-- Block anon completely
CREATE POLICY "cpu_deny_anon_all"
ON public.client_portal_users FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- Revoke all privileges - only service_role can access
REVOKE ALL ON public.client_portal_users FROM public, anon, authenticated;

-- Ensure the safe view exists and is accessible
GRANT SELECT ON public.client_portal_users_safe TO authenticated;

-- =============================================
-- 2. HARDEN password_entries - strict owner-only access
-- =============================================
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own passwords" ON public.password_entries;
DROP POLICY IF EXISTS "Users can create their own passwords" ON public.password_entries;
DROP POLICY IF EXISTS "Users can update their own passwords" ON public.password_entries;
DROP POLICY IF EXISTS "Users can delete their own passwords" ON public.password_entries;
DROP POLICY IF EXISTS "pe_select_owner_only" ON public.password_entries;
DROP POLICY IF EXISTS "pe_insert_owner_only" ON public.password_entries;
DROP POLICY IF EXISTS "pe_update_owner_only" ON public.password_entries;
DROP POLICY IF EXISTS "pe_delete_owner_only" ON public.password_entries;

-- Strict owner-only access with proper type casting for shared_with
CREATE POLICY "pe_select_owner_or_shared"
ON public.password_entries FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR (shared_with IS NOT NULL AND auth.uid()::text = ANY(shared_with::text[]))
);

CREATE POLICY "pe_insert_owner_only"
ON public.password_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pe_update_owner_only"
ON public.password_entries FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pe_delete_owner_only"
ON public.password_entries FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Block anon completely
CREATE POLICY "pe_deny_anon_all"
ON public.password_entries FOR ALL TO anon
USING (false)
WITH CHECK (false);

-- Revoke from public/anon, grant to authenticated
REVOKE ALL ON public.password_entries FROM public, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_entries TO authenticated;