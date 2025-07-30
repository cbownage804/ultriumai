-- Create teams table for team-based vault sharing
CREATE TABLE public.safepass_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team memberships table
CREATE TABLE public.safepass_team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.safepass_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false, "can_share": false, "can_admin": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create shared vaults table
CREATE TABLE public.safepass_shared_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.safepass_teams(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false, "can_share": false}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vault_id, team_id)
);

-- Create emergency access table
CREATE TABLE public.safepass_emergency_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emergency_contact_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL DEFAULT 'vault' CHECK (access_type IN ('vault', 'all_vaults')),
  wait_period_hours INTEGER DEFAULT 48,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'granted', 'denied', 'expired')),
  requested_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vault_owner_id, emergency_contact_id, vault_id)
);

-- Create security monitoring table
CREATE TABLE public.safepass_security_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.safepass_entries(id) ON DELETE CASCADE,
  monitoring_type TEXT NOT NULL CHECK (monitoring_type IN ('breach_check', 'dark_web', 'weak_password', 'reused_password', 'old_password')),
  threat_level TEXT NOT NULL DEFAULT 'low' CHECK (threat_level IN ('critical', 'high', 'medium', 'low', 'info')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
  details JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MSP client policies table
CREATE TABLE public.safepass_msp_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('password_requirements', 'sharing_restrictions', 'audit_settings', 'backup_settings')),
  policy_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enforced BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create password breach database table
CREATE TABLE public.safepass_breach_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL UNIQUE,
  breach_count INTEGER DEFAULT 1,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  breach_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.safepass_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_shared_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_emergency_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_security_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_msp_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_breach_database ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
CREATE POLICY "Users can view teams they own or are members of" 
ON public.safepass_teams 
FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  id IN (
    SELECT team_id FROM public.safepass_team_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can create their own teams" 
ON public.safepass_teams 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update their teams" 
ON public.safepass_teams 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" 
ON public.safepass_teams 
FOR DELETE 
USING (owner_id = auth.uid());

-- RLS policies for team memberships
CREATE POLICY "Users can view team memberships for their teams" 
ON public.safepass_team_memberships 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  team_id IN (
    SELECT id FROM public.safepass_teams WHERE owner_id = auth.uid()
  ) OR
  team_id IN (
    SELECT team_id FROM public.safepass_team_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Team owners and admins can manage memberships" 
ON public.safepass_team_memberships 
FOR ALL 
USING (
  team_id IN (
    SELECT id FROM public.safepass_teams WHERE owner_id = auth.uid()
  ) OR
  team_id IN (
    SELECT team_id FROM public.safepass_team_memberships 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
  )
);

-- RLS policies for shared vaults
CREATE POLICY "Users can view shared vaults for their teams" 
ON public.safepass_shared_vaults 
FOR SELECT 
USING (
  shared_by = auth.uid() OR
  team_id IN (
    SELECT team_id FROM public.safepass_team_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can share their vaults" 
ON public.safepass_shared_vaults 
FOR INSERT 
WITH CHECK (
  shared_by = auth.uid() AND
  vault_id IN (
    SELECT id FROM public.safepass_vaults WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Vault owners can manage their shared vaults" 
ON public.safepass_shared_vaults 
FOR ALL 
USING (shared_by = auth.uid());

-- RLS policies for emergency access
CREATE POLICY "Users can manage their emergency access settings" 
ON public.safepass_emergency_access 
FOR ALL 
USING (
  vault_owner_id = auth.uid() OR 
  emergency_contact_id = auth.uid()
);

-- RLS policies for security monitoring
CREATE POLICY "Users can view their own security monitoring" 
ON public.safepass_security_monitoring 
FOR ALL 
USING (user_id = auth.uid());

-- RLS policies for MSP policies
CREATE POLICY "MSPs can manage their client policies" 
ON public.safepass_msp_policies 
FOR ALL 
USING (
  created_by = auth.uid() OR
  client_id IN (
    SELECT mc.id FROM public.msp_clients mc
    JOIN public.msps m ON m.id = mc.msp_id
    WHERE m.user_id = auth.uid()
  )
);

-- RLS policies for breach database (system managed)
CREATE POLICY "System can manage breach database" 
ON public.safepass_breach_database 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_safepass_team_memberships_user_team ON public.safepass_team_memberships(user_id, team_id);
CREATE INDEX idx_safepass_team_memberships_team_active ON public.safepass_team_memberships(team_id, is_active);
CREATE INDEX idx_safepass_shared_vaults_team ON public.safepass_shared_vaults(team_id, is_active);
CREATE INDEX idx_safepass_shared_vaults_vault ON public.safepass_shared_vaults(vault_id);
CREATE INDEX idx_safepass_emergency_access_owner ON public.safepass_emergency_access(vault_owner_id, status);
CREATE INDEX idx_safepass_emergency_access_contact ON public.safepass_emergency_access(emergency_contact_id, status);
CREATE INDEX idx_safepass_security_monitoring_user ON public.safepass_security_monitoring(user_id, status);
CREATE INDEX idx_safepass_security_monitoring_entry ON public.safepass_security_monitoring(entry_id);
CREATE INDEX idx_safepass_breach_database_hash ON public.safepass_breach_database(password_hash);

-- Create triggers for updated_at
CREATE TRIGGER update_safepass_teams_updated_at
BEFORE UPDATE ON public.safepass_teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safepass_team_memberships_updated_at
BEFORE UPDATE ON public.safepass_team_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safepass_shared_vaults_updated_at
BEFORE UPDATE ON public.safepass_shared_vaults
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safepass_emergency_access_updated_at
BEFORE UPDATE ON public.safepass_emergency_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safepass_security_monitoring_updated_at
BEFORE UPDATE ON public.safepass_security_monitoring
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safepass_msp_policies_updated_at
BEFORE UPDATE ON public.safepass_msp_policies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safepass_breach_database_updated_at
BEFORE UPDATE ON public.safepass_breach_database
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();