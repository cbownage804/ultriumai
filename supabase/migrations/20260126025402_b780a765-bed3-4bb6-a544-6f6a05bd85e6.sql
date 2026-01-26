-- Fix security issue: client_portal_users password hash exposure
-- Create a secure view that excludes password_hash and sensitive fields

-- First, create the safe view excluding sensitive fields
CREATE OR REPLACE VIEW public.client_portal_users_safe
WITH (security_invoker = on) AS
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

-- Drop existing permissive policies on client_portal_users
DROP POLICY IF EXISTS "Users can view client portal users" ON public.client_portal_users;
DROP POLICY IF EXISTS "Client portal users can view own data" ON public.client_portal_users;
DROP POLICY IF EXISTS "MSP staff can view client users" ON public.client_portal_users;
DROP POLICY IF EXISTS "MSP owners can manage client users" ON public.client_portal_users;

-- Create restrictive policies - deny direct SELECT to protect password_hash
-- Users must query through the safe view instead
CREATE POLICY "Deny direct select - use safe view" 
ON public.client_portal_users 
FOR SELECT 
USING (false);

-- Allow INSERT for MSP owners/staff creating users
CREATE POLICY "MSP can insert client users" 
ON public.client_portal_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON mc.msp_id = m.id
    WHERE mc.id = client_id AND m.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.msp_staff ms
    JOIN public.msp_clients mc ON mc.msp_id = ms.msp_id
    WHERE mc.id = client_id AND ms.user_id = auth.uid() AND ms.is_active = true
  )
);

-- Allow UPDATE for MSP owners/staff or the user themselves
CREATE POLICY "MSP or self can update client users" 
ON public.client_portal_users 
FOR UPDATE 
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON mc.msp_id = m.id
    WHERE mc.id = client_id AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.msp_staff ms
    JOIN public.msp_clients mc ON mc.msp_id = ms.msp_id
    WHERE mc.id = client_id AND ms.user_id = auth.uid() AND ms.is_active = true
  )
);

-- Allow DELETE for MSP owners only
CREATE POLICY "MSP owners can delete client users" 
ON public.client_portal_users 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.msp_clients mc
    JOIN public.msps m ON mc.msp_id = m.id
    WHERE mc.id = client_id AND m.user_id = auth.uid()
  )
);