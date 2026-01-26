-- Fix client_portal_users RLS policy conflicts
-- The RESTRICTIVE policies are blocking legitimate access patterns

-- Drop the overly restrictive policies that conflict with the safe view approach
DROP POLICY IF EXISTS "cpu_deny_anon_all" ON public.client_portal_users;
DROP POLICY IF EXISTS "cpu_deny_authenticated_all" ON public.client_portal_users;

-- The existing policies are correct:
-- 1. "Block anonymous access to client_portal_users" - blocks anon
-- 2. "Deny direct select - use safe view" - forces use of safe view for SELECT
-- 3. INSERT/UPDATE/DELETE policies for MSP owners/staff

-- For profiles table, verify the policies are restrictive enough
-- The current policies look correct: users can only see/modify their own profile
-- Admins (is_ultrium_employee) can view/update all - this is expected for admin functionality

-- Add comment to document the security model
COMMENT ON TABLE public.client_portal_users IS 'Client portal user accounts. Direct SELECT is denied - use client_portal_users_safe view instead. Password hashes are never exposed through the safe view.';

COMMENT ON TABLE public.profiles IS 'User profiles with RLS ensuring users can only access their own profile. Ultrium employees have admin access for support purposes.';