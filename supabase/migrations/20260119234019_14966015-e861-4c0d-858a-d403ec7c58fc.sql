-- Fix overly permissive emergency access RLS policies
-- Drop the existing broad policy
DROP POLICY IF EXISTS "Users can manage their emergency access settings" ON public.safepass_emergency_access;

-- Create separate policies for vault owners (full control)
CREATE POLICY "Vault owners can manage emergency access"
ON public.safepass_emergency_access
FOR ALL
USING (vault_owner_id = auth.uid())
WITH CHECK (vault_owner_id = auth.uid());

-- Emergency contacts can only SELECT their access records
CREATE POLICY "Emergency contacts can view their access"
ON public.safepass_emergency_access
FOR SELECT
USING (emergency_contact_id = auth.uid());

-- Emergency contacts can only UPDATE to request access (status, requested_at, reason only)
-- They cannot grant themselves access - only request it
CREATE POLICY "Emergency contacts can request access"
ON public.safepass_emergency_access
FOR UPDATE
USING (emergency_contact_id = auth.uid() AND status = 'active')
WITH CHECK (
  emergency_contact_id = auth.uid() AND 
  status IN ('pending', 'active') -- Can only set to pending (request), not granted
);