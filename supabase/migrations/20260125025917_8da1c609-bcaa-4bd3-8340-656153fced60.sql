-- Fix 1: Secure profiles_safe view - revoke public access
REVOKE SELECT ON public.profiles_safe FROM anon;
REVOKE SELECT ON public.profiles_safe FROM public;

-- Fix 2: Secure msp_billing_summary view - revoke public access  
REVOKE SELECT ON public.msp_billing_summary FROM anon;
REVOKE SELECT ON public.msp_billing_summary FROM public;

-- Fix 3: Fix client_portal_users conflicting RLS policies
-- Drop the problematic "Deny direct select" policy and keep proper access control
DROP POLICY IF EXISTS "Deny direct select" ON public.client_portal_users;
DROP POLICY IF EXISTS "No direct access to client_portal_users" ON public.client_portal_users;

-- Create a proper policy that only allows users to see their own record (if needed for password updates)
CREATE POLICY "Users can only access own record"
ON public.client_portal_users
FOR ALL
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);