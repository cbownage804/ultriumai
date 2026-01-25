-- 1. Revoke public/anon access to profiles_safe and grant only to authenticated users
REVOKE ALL ON public.profiles_safe FROM public, anon;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- 2. Recreate profiles_safe as SECURITY INVOKER (default but explicit) so RLS is respected
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT
    id,
    user_id,
    full_name,
    avatar_url,
    account_type,
    created_at,
    updated_at
FROM public.profiles
WHERE auth.uid() = user_id;

-- Apply the grants again after replace
REVOKE ALL ON public.profiles_safe FROM public, anon;
GRANT SELECT ON public.profiles_safe TO authenticated;