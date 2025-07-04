-- Fix the infinite recursion in team_memberships policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view memberships for teams they belong to" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can insert memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can update memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners can delete memberships" ON public.team_memberships;

-- Recreate policies without circular references
CREATE POLICY "Users can view their own memberships" 
ON public.team_memberships 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Team owners can view all team memberships" 
ON public.team_memberships 
FOR SELECT 
USING (
  team_id IN (
    SELECT id FROM teams WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can insert memberships" 
ON public.team_memberships 
FOR INSERT 
WITH CHECK (
  team_id IN (
    SELECT id FROM teams WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can update memberships" 
ON public.team_memberships 
FOR UPDATE 
USING (
  team_id IN (
    SELECT id FROM teams WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can delete memberships" 
ON public.team_memberships 
FOR DELETE 
USING (
  team_id IN (
    SELECT id FROM teams WHERE owner_id = auth.uid()
  )
);