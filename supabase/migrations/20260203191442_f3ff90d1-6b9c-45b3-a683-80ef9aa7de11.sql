-- Fix overly permissive RLS policies

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can insert portal activity logs" ON public.portal_activity_logs;
DROP POLICY IF EXISTS "Allow token management" ON public.portal_password_reset_tokens;

-- Activity logs should only be insertable by the MSP (through edge function with service role)
-- We'll use a service role function instead, no direct insert policy needed

-- Password reset tokens - only allow select for validation, inserts/updates via service role
CREATE POLICY "Select reset tokens for validation"
ON public.portal_password_reset_tokens
FOR SELECT
USING (
  portal_user_id IN (
    SELECT id FROM public.client_portal_users
  )
);