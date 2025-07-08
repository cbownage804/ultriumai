-- Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate the function to ensure it's fresh
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with explicit schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create profile entry for new user
  INSERT INTO public.profiles (id, user_id, email, full_name, account_type, company_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'business'::public.account_type),
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    account_type = COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, public.profiles.account_type),
    company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', public.profiles.company_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();