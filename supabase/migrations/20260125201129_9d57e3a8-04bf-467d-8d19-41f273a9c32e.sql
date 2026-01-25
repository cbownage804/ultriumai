-- Fix 1: Harden safepass_msp_invites table
-- Drop the overly permissive "anyone can view by token" policy (qual:true is dangerous)
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.safepass_msp_invites;

-- Create a restrictive policy for authenticated users only
-- MSP users who created the invite OR the invitee (matched by email) can view
CREATE POLICY "Authenticated users can view relevant invites"
ON public.safepass_msp_invites
FOR SELECT
TO authenticated
USING (
  -- MSP users who created the invite can view it
  auth.uid() = msp_user_id
  OR 
  -- The invitee can view their own invite (by email match)
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Block anonymous access entirely
CREATE POLICY "Block anonymous access to invites"
ON public.safepass_msp_invites
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke public privileges from invites table
REVOKE ALL ON public.safepass_msp_invites FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safepass_msp_invites TO authenticated;

-- Fix 2: Harden security_api_keys table
-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Users can view own API keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.security_api_keys;

-- Strict owner-only policies
CREATE POLICY "Owner can view own API keys"
ON public.security_api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own API keys"
ON public.security_api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own API keys"
ON public.security_api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own API keys"
ON public.security_api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Block anonymous access entirely
DROP POLICY IF EXISTS "Block anonymous access to security_api_keys" ON public.security_api_keys;
CREATE POLICY "Block anonymous access to security_api_keys"
ON public.security_api_keys
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke public privileges
REVOKE ALL ON public.security_api_keys FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_api_keys TO authenticated;