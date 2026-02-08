
-- 1. Create feature_flags table
CREATE TABLE public.feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key text NOT NULL UNIQUE,
    flag_name text NOT NULL,
    description text,
    is_enabled boolean NOT NULL DEFAULT true,
    applies_to text NOT NULL DEFAULT 'all',
    metadata jsonb DEFAULT '{}',
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read feature flags"
ON public.feature_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert feature flags"
ON public.feature_flags FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update feature flags"
ON public.feature_flags FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete feature flags"
ON public.feature_flags FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Seed default feature flags
INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled) VALUES
('ai_studio', 'AI Studio', 'Enable AI Studio product for all users', true),
('safesuite', 'SafeSuite', 'Enable SafeSuite compliance product', true),
('vanguard', 'Vanguard Command', 'Enable Vanguard endpoint management', true),
('atlas', 'Atlas Documentation', 'Enable Atlas documentation system', true),
('social_media', 'Social Media Manager', 'Enable social media management tools', true),
('maintenance_mode', 'Maintenance Mode', 'Put entire site into maintenance mode', false);

-- 3. Grant admin role to @ultriumai.com users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email LIKE '%@ultriumai.com%'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Add granted_by column to user_roles if missing
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Update is_admin_user to use roles table
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;
