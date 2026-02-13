
CREATE OR REPLACE FUNCTION public.is_ultrium_employee(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND (email LIKE '%@ultriumai.com' OR email LIKE '%@ultriumllc.com')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;
