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