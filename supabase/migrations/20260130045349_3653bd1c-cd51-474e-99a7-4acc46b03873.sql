-- Phase 1: Security Hardening
-- Create is_service_role() function for secure RLS policies

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_service_role() IS 'Returns true if the current request is using the service role key. Used for RLS policies that should only be accessible by edge functions.';