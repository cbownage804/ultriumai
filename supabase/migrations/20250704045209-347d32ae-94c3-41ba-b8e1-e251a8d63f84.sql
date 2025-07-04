-- Complete fix for team_memberships infinite recursion
-- First, disable RLS temporarily to check current state
ALTER TABLE public.team_memberships DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can view all team memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can insert memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can update memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can delete memberships" ON public.team_memberships;

-- Re-enable RLS
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own memberships" 
ON public.team_memberships 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Team owners can manage all team memberships" 
ON public.team_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_memberships.team_id 
    AND teams.owner_id = auth.uid()
  )
);

-- Allow users to be inserted into teams (for invitations)
CREATE POLICY "Allow team membership creation" 
ON public.team_memberships 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = team_memberships.team_id 
    AND teams.owner_id = auth.uid()
  )
);