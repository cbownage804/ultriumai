-- SafeSuite Business Teams Infrastructure

-- Teams table for Business tier organizations
CREATE TABLE public.safesuite_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT, -- Stripe subscription ID
  seat_count INTEGER NOT NULL DEFAULT 1,
  max_seats INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team memberships
CREATE TABLE public.safesuite_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.safesuite_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Shared password vaults for teams
CREATE TABLE public.safesuite_shared_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.safesuite_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entries in shared vaults (separate from personal safepass_entries)
CREATE TABLE public.safesuite_shared_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.safesuite_shared_vaults(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.safesuite_teams(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'password' CHECK (entry_type IN ('password', 'note', 'card', 'identity')),
  title TEXT NOT NULL,
  encrypted_data TEXT NOT NULL, -- Encrypted with team key
  website_url TEXT,
  folder TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  password_strength_score INTEGER,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Access permissions for shared vault entries
CREATE TABLE public.safesuite_entry_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.safesuite_shared_entries(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.safesuite_team_members(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'use', 'edit', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entry_id, member_id)
);

-- Team activity audit log
CREATE TABLE public.safesuite_team_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.safesuite_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.safesuite_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safesuite_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safesuite_shared_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safesuite_shared_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safesuite_entry_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safesuite_team_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is team member
CREATE OR REPLACE FUNCTION public.is_safesuite_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.safesuite_team_members
    WHERE team_id = _team_id
    AND user_id = _user_id
    AND status = 'active'
  );
$$;

-- Helper function: Check if user is team admin/owner
CREATE OR REPLACE FUNCTION public.is_safesuite_team_admin(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.safesuite_team_members
    WHERE team_id = _team_id
    AND user_id = _user_id
    AND status = 'active'
    AND role IN ('owner', 'admin')
  );
$$;

-- Helper function: Get user's team ID
CREATE OR REPLACE FUNCTION public.get_user_safesuite_team(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.safesuite_team_members
  WHERE user_id = _user_id
  AND status = 'active'
  LIMIT 1;
$$;

-- RLS Policies for safesuite_teams
CREATE POLICY "Team owners can manage their teams"
ON public.safesuite_teams FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team members can view their team"
ON public.safesuite_teams FOR SELECT
TO authenticated
USING (public.is_safesuite_team_member(auth.uid(), id));

-- RLS Policies for safesuite_team_members
CREATE POLICY "Team admins can manage members"
ON public.safesuite_team_members FOR ALL
TO authenticated
USING (public.is_safesuite_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_safesuite_team_admin(auth.uid(), team_id));

CREATE POLICY "Members can view team roster"
ON public.safesuite_team_members FOR SELECT
TO authenticated
USING (public.is_safesuite_team_member(auth.uid(), team_id));

CREATE POLICY "Users can view their own membership"
ON public.safesuite_team_members FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies for safesuite_shared_vaults
CREATE POLICY "Team members can view shared vaults"
ON public.safesuite_shared_vaults FOR SELECT
TO authenticated
USING (public.is_safesuite_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage shared vaults"
ON public.safesuite_shared_vaults FOR ALL
TO authenticated
USING (public.is_safesuite_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_safesuite_team_admin(auth.uid(), team_id));

-- RLS Policies for safesuite_shared_entries
CREATE POLICY "Team members can view shared entries"
ON public.safesuite_shared_entries FOR SELECT
TO authenticated
USING (public.is_safesuite_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can manage shared entries"
ON public.safesuite_shared_entries FOR ALL
TO authenticated
USING (public.is_safesuite_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_safesuite_team_admin(auth.uid(), team_id));

CREATE POLICY "Entry creators can update their entries"
ON public.safesuite_shared_entries FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- RLS Policies for safesuite_entry_permissions
CREATE POLICY "Team admins can manage permissions"
ON public.safesuite_entry_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.safesuite_shared_entries e
    WHERE e.id = entry_id
    AND public.is_safesuite_team_admin(auth.uid(), e.team_id)
  )
);

CREATE POLICY "Users can view their own permissions"
ON public.safesuite_entry_permissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.safesuite_team_members m
    WHERE m.id = member_id
    AND m.user_id = auth.uid()
  )
);

-- RLS Policies for safesuite_team_audit_log
CREATE POLICY "Team admins can view audit log"
ON public.safesuite_team_audit_log FOR SELECT
TO authenticated
USING (public.is_safesuite_team_admin(auth.uid(), team_id));

CREATE POLICY "System can insert audit logs"
ON public.safesuite_team_audit_log FOR INSERT
TO authenticated
WITH CHECK (public.is_safesuite_team_member(auth.uid(), team_id));

-- Triggers for updated_at
CREATE TRIGGER update_safesuite_teams_updated_at
  BEFORE UPDATE ON public.safesuite_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_safesuite_team_members_updated_at
  BEFORE UPDATE ON public.safesuite_team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_safesuite_shared_vaults_updated_at
  BEFORE UPDATE ON public.safesuite_shared_vaults
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_safesuite_shared_entries_updated_at
  BEFORE UPDATE ON public.safesuite_shared_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-add owner as team member when team is created
CREATE OR REPLACE FUNCTION public.auto_add_team_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.safesuite_team_members (team_id, user_id, email, role, status, joined_at)
  SELECT NEW.id, NEW.owner_id, u.email, 'owner', 'active', now()
  FROM auth.users u WHERE u.id = NEW.owner_id;
  
  -- Create default shared vault
  INSERT INTO public.safesuite_shared_vaults (team_id, name, description, created_by)
  VALUES (NEW.id, 'Team Vault', 'Default shared password vault for your team', NEW.owner_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.safesuite_teams
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_team_owner();

-- Indexes for performance
CREATE INDEX idx_team_members_team_id ON public.safesuite_team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.safesuite_team_members(user_id);
CREATE INDEX idx_team_members_email ON public.safesuite_team_members(email);
CREATE INDEX idx_shared_entries_vault_id ON public.safesuite_shared_entries(vault_id);
CREATE INDEX idx_shared_entries_team_id ON public.safesuite_shared_entries(team_id);
CREATE INDEX idx_audit_log_team_id ON public.safesuite_team_audit_log(team_id);