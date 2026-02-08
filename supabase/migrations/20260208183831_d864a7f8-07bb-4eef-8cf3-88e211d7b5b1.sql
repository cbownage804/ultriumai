
-- ============================================
-- org_teams: the company/team entity for license management
-- ============================================
CREATE TABLE public.org_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  billing_email TEXT,
  max_members INTEGER NOT NULL DEFAULT 50,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.org_teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- org_team_members
-- ============================================
CREATE TABLE public.org_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.org_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.org_team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- org_team_licenses
-- ============================================
CREATE TABLE public.org_team_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.org_teams(id) ON DELETE CASCADE,
  product TEXT NOT NULL CHECK (product IN ('ai_studio', 'safesuite', 'vanguard')),
  access_level TEXT NOT NULL CHECK (access_level IN ('pro', 'business', 'enterprise')),
  total_seats INTEGER NOT NULL DEFAULT 1,
  used_seats INTEGER NOT NULL DEFAULT 0,
  stripe_subscription_id TEXT,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, product)
);

ALTER TABLE public.org_team_licenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- org_team_license_assignments
-- ============================================
CREATE TABLE public.org_team_license_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.org_team_licenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.org_team_members(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(license_id, member_id)
);

ALTER TABLE public.org_team_license_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper functions
-- ============================================
CREATE OR REPLACE FUNCTION public.is_org_team_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_team_members
    WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_team_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_team_members
    WHERE organization_id = p_org_id AND user_id = p_user_id AND role IN ('owner', 'admin') AND status = 'active'
  );
$$;

-- ============================================
-- RLS: org_teams
-- ============================================
CREATE POLICY "Members can view their org" ON public.org_teams FOR SELECT
  USING (public.is_org_team_member(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Users can create orgs" ON public.org_teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can update org" ON public.org_teams FOR UPDATE
  USING (public.is_org_team_admin(id, auth.uid()));

CREATE POLICY "Owner can delete org" ON public.org_teams FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- RLS: org_team_members
-- ============================================
CREATE POLICY "Members can view members" ON public.org_team_members FOR SELECT
  USING (public.is_org_team_member(organization_id, auth.uid()));

CREATE POLICY "Admins can add members" ON public.org_team_members FOR INSERT
  WITH CHECK (public.is_org_team_admin(organization_id, auth.uid()) OR invited_by = auth.uid());

CREATE POLICY "Admins can update members" ON public.org_team_members FOR UPDATE
  USING (public.is_org_team_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can remove members" ON public.org_team_members FOR DELETE
  USING (public.is_org_team_admin(organization_id, auth.uid()));

-- ============================================
-- RLS: org_team_licenses
-- ============================================
CREATE POLICY "Members can view licenses" ON public.org_team_licenses FOR SELECT
  USING (public.is_org_team_member(organization_id, auth.uid()));

CREATE POLICY "Admins can add licenses" ON public.org_team_licenses FOR INSERT
  WITH CHECK (public.is_org_team_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update licenses" ON public.org_team_licenses FOR UPDATE
  USING (public.is_org_team_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can delete licenses" ON public.org_team_licenses FOR DELETE
  USING (public.is_org_team_admin(organization_id, auth.uid()));

-- ============================================
-- RLS: org_team_license_assignments
-- ============================================
CREATE POLICY "Members can view assignments" ON public.org_team_license_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_team_licenses ol
    WHERE ol.id = license_id AND public.is_org_team_member(ol.organization_id, auth.uid())
  ));

CREATE POLICY "Admins can assign licenses" ON public.org_team_license_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_team_licenses ol
    WHERE ol.id = license_id AND public.is_org_team_admin(ol.organization_id, auth.uid())
  ));

CREATE POLICY "Admins can remove assignments" ON public.org_team_license_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.org_team_licenses ol
    WHERE ol.id = license_id AND public.is_org_team_admin(ol.organization_id, auth.uid())
  ));

-- ============================================
-- Triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.update_org_team_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_org_teams_updated_at BEFORE UPDATE ON public.org_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_org_team_updated_at();

CREATE TRIGGER update_org_team_members_updated_at BEFORE UPDATE ON public.org_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_org_team_updated_at();

CREATE TRIGGER update_org_team_licenses_updated_at BEFORE UPDATE ON public.org_team_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_org_team_updated_at();

-- ============================================
-- Auto-add owner as active member
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_add_org_team_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.org_team_members (organization_id, user_id, email, role, status, joined_at)
  SELECT NEW.id, NEW.owner_id, u.email, 'owner', 'active', now()
  FROM auth.users u WHERE u.id = NEW.owner_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_add_org_team_owner_trigger AFTER INSERT ON public.org_teams
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_org_team_owner();
