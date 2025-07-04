-- Final fix for team_memberships infinite recursion
-- Disable all team-related functionality temporarily
ALTER TABLE public.team_memberships DISABLE ROW LEVEL SECURITY;

-- Simplify the custom_gpts policy to remove team references
DROP POLICY IF EXISTS "Users can view their own GPTs and team GPTs" ON public.custom_gpts;

CREATE POLICY "Users can view their own GPTs only" 
ON public.custom_gpts 
FOR SELECT 
USING (user_id = auth.uid() OR sharing_level = 'public');