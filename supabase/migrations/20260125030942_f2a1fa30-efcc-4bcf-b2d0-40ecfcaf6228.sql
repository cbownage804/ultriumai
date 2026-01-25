-- Fix "permission denied for table profiles" during signup
-- The handle_new_user trigger needs INSERT rights on profiles

-- 1) Grant INSERT on profiles to authenticated (for trigger context)
GRANT INSERT ON TABLE public.profiles TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- 2) Ensure the trigger function is SECURITY DEFINER and owned by postgres
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3) Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4) Also fix msp_clients permission errors seen in logs
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.msp_clients TO authenticated;