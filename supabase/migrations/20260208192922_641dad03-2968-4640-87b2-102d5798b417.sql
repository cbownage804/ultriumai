
-- Add org_admin to the app_role enum if not already there
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'org_admin';

-- Create trigger function to auto-assign org_admin role on signup
CREATE OR REPLACE FUNCTION public.auto_assign_org_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'org_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_assign_org_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_org_admin();
