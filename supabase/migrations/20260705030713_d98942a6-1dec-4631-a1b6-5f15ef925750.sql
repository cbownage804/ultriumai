
DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM ('super_admin','support','billing_ops','platform_ops','read_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.platform_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "self can view own platform role" ON public.platform_admins;
CREATE POLICY "self can view own platform role"
  ON public.platform_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role public.platform_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND (role = _role OR role = 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
$$;

DROP POLICY IF EXISTS "super_admin manages platform_admins" ON public.platform_admins;
CREATE POLICY "super_admin manages platform_admins"
  ON public.platform_admins FOR ALL TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_platform_role(auth.uid(), 'super_admin'));

INSERT INTO public.platform_admins (user_id, role)
VALUES ('b8cfe427-6c70-456c-a793-2279f9ddae40', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled)
SELECT 'admin_banner', 'Maintenance Banner', 'Global maintenance/announcement banner', false
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE flag_key = 'admin_banner');
