
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_team_members
    WHERE user_id = _user_id AND organization_id = _org_id AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.org_teams WHERE id = _org_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_team_members
    WHERE user_id = _user_id AND organization_id = _org_id
      AND role IN ('owner', 'admin') AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.org_teams WHERE id = _org_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.ray_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 1. ray_org_profiles
CREATE TABLE public.ray_org_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid,
  display_name text NOT NULL,
  email text,
  department text,
  score int NOT NULL DEFAULT 0,
  mfa_enabled boolean NOT NULL DEFAULT false,
  breach_count int NOT NULL DEFAULT 0,
  weak_password_count int NOT NULL DEFAULT 0,
  reused_password_count int NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  top_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ray_note text,
  priority_rank int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ray_org_profiles TO authenticated;
GRANT ALL ON public.ray_org_profiles TO service_role;
ALTER TABLE public.ray_org_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view profiles" ON public.ray_org_profiles
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER ray_org_profiles_upd BEFORE UPDATE ON public.ray_org_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();
CREATE UNIQUE INDEX ray_org_profiles_user_uq ON public.ray_org_profiles (org_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX ray_org_profiles_email_uq ON public.ray_org_profiles (org_id, lower(email)) WHERE user_id IS NULL AND email IS NOT NULL;
CREATE INDEX ray_org_profiles_org_idx ON public.ray_org_profiles (org_id, priority_rank);

-- 2. ray_org_health
CREATE TABLE public.ray_org_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  snapshot_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  overall_score int NOT NULL DEFAULT 0,
  score_delta int NOT NULL DEFAULT 0,
  identity_score int NOT NULL DEFAULT 0,
  device_score int NOT NULL DEFAULT 0,
  threat_score int NOT NULL DEFAULT 0,
  exposure_score int NOT NULL DEFAULT 0,
  compliance_score int NOT NULL DEFAULT 0,
  training_score int NOT NULL DEFAULT 0,
  software_score int NOT NULL DEFAULT 0,
  domain_score int NOT NULL DEFAULT 0,
  ray_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, snapshot_date)
);
GRANT SELECT ON public.ray_org_health TO authenticated;
GRANT ALL ON public.ray_org_health TO service_role;
ALTER TABLE public.ray_org_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view health" ON public.ray_org_health
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER ray_org_health_upd BEFORE UPDATE ON public.ray_org_health
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();

-- 3. ray_org_missions
CREATE TABLE public.ray_org_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  target int NOT NULL DEFAULT 0,
  progress int NOT NULL DEFAULT 0,
  est_minutes_remaining int,
  status text NOT NULL DEFAULT 'active',
  owner_user_id uuid,
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.ray_org_missions TO authenticated;
GRANT ALL ON public.ray_org_missions TO service_role;
ALTER TABLE public.ray_org_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view missions" ON public.ray_org_missions
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE POLICY "Org admins create missions" ON public.ray_org_missions
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE POLICY "Org admins update missions" ON public.ray_org_missions
  FOR UPDATE TO authenticated USING (public.is_org_admin(auth.uid(), org_id))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));
CREATE TRIGGER ray_org_missions_upd BEFORE UPDATE ON public.ray_org_missions
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();

-- 4. ray_org_timeline
CREATE TABLE public.ray_org_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor text,
  actor_user_id uuid,
  category text NOT NULL,
  summary text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ray_org_timeline TO authenticated;
GRANT ALL ON public.ray_org_timeline TO service_role;
ALTER TABLE public.ray_org_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view timeline" ON public.ray_org_timeline
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE INDEX ray_org_timeline_idx ON public.ray_org_timeline (org_id, occurred_at DESC);

-- 5. ray_org_briefings
CREATE TABLE public.ray_org_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  msp_owner_user_id uuid,
  scope text NOT NULL DEFAULT 'org',
  brief_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  greeting text,
  summary text NOT NULL,
  recommendation text,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  spoken_script text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ray_org_briefings_scope_chk
    CHECK ((scope = 'org' AND org_id IS NOT NULL)
        OR (scope = 'msp' AND msp_owner_user_id IS NOT NULL))
);
GRANT SELECT, UPDATE ON public.ray_org_briefings TO authenticated;
GRANT ALL ON public.ray_org_briefings TO service_role;
ALTER TABLE public.ray_org_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View org or msp briefings" ON public.ray_org_briefings
  FOR SELECT TO authenticated USING (
    (scope = 'org' AND org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id))
    OR (scope = 'msp' AND msp_owner_user_id = auth.uid())
  );
CREATE POLICY "React to briefings" ON public.ray_org_briefings
  FOR UPDATE TO authenticated USING (
    (scope = 'org' AND org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id))
    OR (scope = 'msp' AND msp_owner_user_id = auth.uid())
  ) WITH CHECK (
    (scope = 'org' AND org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id))
    OR (scope = 'msp' AND msp_owner_user_id = auth.uid())
  );
CREATE TRIGGER ray_org_briefings_upd BEFORE UPDATE ON public.ray_org_briefings
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();
CREATE UNIQUE INDEX ray_org_briefings_org_date_uq ON public.ray_org_briefings (org_id, brief_date) WHERE scope = 'org';
CREATE UNIQUE INDEX ray_org_briefings_msp_date_uq ON public.ray_org_briefings (msp_owner_user_id, brief_date) WHERE scope = 'msp';

-- 6. ray_org_department_scores
CREATE TABLE public.ray_org_department_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  department text NOT NULL,
  snapshot_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  score int NOT NULL DEFAULT 0,
  employee_count int NOT NULL DEFAULT 0,
  ray_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, department, snapshot_date)
);
GRANT SELECT ON public.ray_org_department_scores TO authenticated;
GRANT ALL ON public.ray_org_department_scores TO service_role;
ALTER TABLE public.ray_org_department_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view department scores" ON public.ray_org_department_scores
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER ray_org_dept_upd BEFORE UPDATE ON public.ray_org_department_scores
  FOR EACH ROW EXECUTE FUNCTION public.ray_set_updated_at();
