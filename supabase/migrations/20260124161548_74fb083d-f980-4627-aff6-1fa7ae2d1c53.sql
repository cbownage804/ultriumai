-- Harden client_portal_users secrets exposure surface

-- 1) Ensure RLS always applies (even to table owner paths)
ALTER TABLE public.client_portal_users FORCE ROW LEVEL SECURITY;

-- 2) The safe view should not be directly queryable by app roles unless explicitly needed.
--    (It already excludes password_hash/reset_token; this also removes any accidental exposure paths.)
REVOKE ALL ON public.client_portal_users_safe FROM PUBLIC;
REVOKE ALL ON public.client_portal_users_safe FROM anon;
REVOKE ALL ON public.client_portal_users_safe FROM authenticated;

-- Keep service_role access for backend/admin operations
GRANT SELECT ON public.client_portal_users_safe TO service_role;