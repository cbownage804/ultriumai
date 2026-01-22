-- Fix client_portal_users security: Remove overly permissive policies and ensure proper access control

-- Drop the overly permissive "MSPs can manage" policy that allows any authenticated user access
DROP POLICY IF EXISTS "MSPs can manage client portal users" ON public.client_portal_users;

-- Drop duplicate service role policies (keep only one)
DROP POLICY IF EXISTS "Service role has full access to client_portal_users" ON public.client_portal_users;

-- Drop the "Users can view their own profile" policy since it uses public role and we want to block direct access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.client_portal_users;

-- Create a proper MSP management policy that checks if user actually owns the MSP for the client
CREATE POLICY "MSPs can manage their clients portal users"
ON public.client_portal_users
FOR ALL
USING (
  client_id IN (
    SELECT mc.id FROM public.msp_clients mc
    JOIN public.msps m ON mc.msp_id = m.id
    WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT mc.id FROM public.msp_clients mc
    JOIN public.msps m ON mc.msp_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- Ensure the deny policy blocks direct authenticated access (already exists but confirming)
-- The safe view should be used instead for reading non-sensitive data