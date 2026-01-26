-- Fix client_portal_users_safe view to use security_invoker
-- This ensures the view respects RLS policies on the base table

-- Drop and recreate view with security_invoker enabled
DROP VIEW IF EXISTS public.client_portal_users_safe;

CREATE VIEW public.client_portal_users_safe
WITH (security_invoker = on)
AS
SELECT 
    id,
    client_id,
    email,
    full_name,
    role,
    is_active,
    last_login_at,
    created_at,
    updated_at
FROM public.client_portal_users;

-- Grant appropriate permissions
GRANT SELECT ON public.client_portal_users_safe TO authenticated;

-- Now the view will respect the RLS policies on client_portal_users table
-- which already blocks anonymous access and restricts authenticated access