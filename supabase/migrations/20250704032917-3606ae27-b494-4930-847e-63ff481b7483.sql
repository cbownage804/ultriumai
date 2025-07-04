-- Fix infinite recursion in team_memberships policies by using a simpler approach

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view memberships for their teams" ON public.team_memberships;
DROP POLICY IF EXISTS "Team admins can manage memberships" ON public.team_memberships;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view memberships for teams they belong to" 
ON public.team_memberships FOR SELECT 
USING (
  user_id = auth.uid() 
  OR team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE t.owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can insert memberships" 
ON public.team_memberships FOR INSERT 
WITH CHECK (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE t.owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can update memberships" 
ON public.team_memberships FOR UPDATE 
USING (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE t.owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can delete memberships" 
ON public.team_memberships FOR DELETE 
USING (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE t.owner_id = auth.uid()
  )
);

-- Fix team invitations policies similarly
DROP POLICY IF EXISTS "Team admins can manage invitations" ON public.team_invitations;

CREATE POLICY "Team owners can manage invitations" 
ON public.team_invitations FOR ALL 
USING (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE t.owner_id = auth.uid()
  )
);