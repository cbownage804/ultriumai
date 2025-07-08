-- Create or replace the handle_new_user function to work with existing profiles table structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create/update profile with account type from metadata
  INSERT INTO public.profiles (id, user_id, email, full_name, account_type, company_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type, 'business'::account_type),
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    account_type = COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type, 'business'::account_type),
    company_name = NEW.raw_user_meta_data->>'company_name',
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();