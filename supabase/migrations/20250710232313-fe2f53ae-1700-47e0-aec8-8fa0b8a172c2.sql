-- Update admin checking functions to include brandon@ultriumllc.com as an exception

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (email LIKE '%@ultriumai.com' OR email = 'brandon@ultriumllc.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_ultrium_employee(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND (email LIKE '%@ultriumai.com' OR email = 'brandon@ultriumllc.com')
  );
$$;