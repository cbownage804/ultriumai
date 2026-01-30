-- Fix 1: Remove overly permissive SELECT policy on helpdesk_technicians
DROP POLICY IF EXISTS "helpdesk_technicians_select_authenticated" ON public.helpdesk_technicians;

-- Create proper RLS: Only allow authenticated users to see their own technician record
CREATE POLICY "Users can view their own technician record"
ON public.helpdesk_technicians
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix 2: Remove admin policy that exposes 2FA secrets
-- Admins should NOT be able to see other users' 2FA secrets - this is a security risk
DROP POLICY IF EXISTS "Admins can view all security settings" ON public.security_settings;

-- 2FA secrets should ONLY be accessible by the user themselves
-- No admin override - this protects against privilege escalation attacks on 2FA