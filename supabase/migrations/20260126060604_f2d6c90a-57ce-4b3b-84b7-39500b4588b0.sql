-- =====================================================
-- FIX: Secure profiles_safe view with RLS
-- =====================================================

-- Enable RLS on the view (views can have RLS in PostgreSQL 15+)
-- For older versions, we need to recreate with security_invoker

-- Drop and recreate view with security_invoker
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe
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

-- Grant access only to authenticated users
REVOKE ALL ON public.profiles_safe FROM anon;
REVOKE ALL ON public.profiles_safe FROM public;
GRANT SELECT ON public.profiles_safe TO authenticated;