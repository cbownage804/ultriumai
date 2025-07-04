-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true
);

-- Create team memberships table
CREATE TABLE public.team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Add team_id to custom_gpts table
ALTER TABLE public.custom_gpts 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN sharing_level TEXT DEFAULT 'private'; -- private, team, public

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they belong to" 
ON public.teams FOR SELECT 
USING (
  id IN (
    SELECT team_id FROM public.team_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Team owners can update their teams" 
ON public.teams FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams" 
ON public.teams FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" 
ON public.teams FOR DELETE 
USING (owner_id = auth.uid());

-- Team memberships policies
CREATE POLICY "Users can view memberships for their teams" 
ON public.team_memberships FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM public.team_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Team admins can manage memberships" 
ON public.team_memberships FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_memberships 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- Team invitations policies
CREATE POLICY "Team admins can manage invitations" 
ON public.team_invitations FOR ALL 
USING (
  team_id IN (
    SELECT team_id FROM public.team_memberships 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- Update custom_gpts policies for team sharing
DROP POLICY IF EXISTS "select_own_gpts" ON public.custom_gpts;
CREATE POLICY "Users can view their own GPTs and team GPTs" 
ON public.custom_gpts FOR SELECT 
USING (
  user_id = auth.uid() 
  OR (
    sharing_level = 'team' 
    AND team_id IN (
      SELECT team_id FROM public.team_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR sharing_level = 'public'
);

-- Create trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically add team owner as member
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_memberships (team_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_team_created
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();