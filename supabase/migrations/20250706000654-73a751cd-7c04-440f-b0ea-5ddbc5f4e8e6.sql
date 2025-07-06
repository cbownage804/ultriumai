-- Fix infinite recursion in team_memberships RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view shared team vaults" ON public.password_vaults;
DROP POLICY IF EXISTS "Users can view their own password entries" ON public.password_entries;
DROP POLICY IF EXISTS "Users can create password entries in their vaults" ON public.password_entries;

-- Create a security definer function to safely check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE user_id = _user_id 
    AND team_id = _team_id 
    AND is_active = true
  )
$$;

-- Recreate vault policies without recursion
CREATE POLICY "Users can view shared team vaults" ON public.password_vaults
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
  );

-- Recreate password entry policies without recursion
CREATE POLICY "Users can view their own password entries" ON public.password_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    vault_id IN (
      SELECT id FROM public.password_vaults 
      WHERE user_id = auth.uid() OR 
      (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
    )
  );

CREATE POLICY "Users can create password entries in their vaults" ON public.password_entries
  FOR INSERT WITH CHECK (
    vault_id IN (
      SELECT id FROM public.password_vaults 
      WHERE user_id = auth.uid() OR 
      (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
    )
  );

-- Ensure you have enterprise subscription for full access
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, stripe_customer_id)
SELECT 
  auth.uid(),
  auth.email(),
  true,
  'enterprise',
  'test_customer_' || auth.uid()::text
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) 
DO UPDATE SET 
  subscribed = true,
  subscription_tier = 'enterprise',
  updated_at = now();

-- Ensure SafePass subscription is active
INSERT INTO public.security_app_subscriptions (user_id, app_id, app_name, status, usage_limit, usage_current)
SELECT 
  auth.uid(),
  'safepass',
  'SafePass Password Manager',
  'active',
  -1, -- unlimited
  0
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, app_id) 
DO UPDATE SET 
  status = 'active',
  usage_limit = -1,
  updated_at = now();