-- Add admin policies to allow UltriumAI employees to view all SafeSuite subscriptions
CREATE POLICY "Admins can view all safesuite subscriptions"
ON public.safesuite_subscriptions
FOR SELECT
TO authenticated
USING (is_ultrium_employee(auth.uid()));

CREATE POLICY "Admins can update all safesuite subscriptions"
ON public.safesuite_subscriptions
FOR UPDATE
TO authenticated
USING (is_ultrium_employee(auth.uid()));

-- Add admin policy to allow UltriumAI employees to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_ultrium_employee(auth.uid()));

-- Add admin policy to allow UltriumAI employees to update profiles (for admin management)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_ultrium_employee(auth.uid()));