-- Fix RLS policies to prevent infinite recursion
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all analytics" ON daily_analytics;
DROP POLICY IF EXISTS "Admins can view all GPT analytics" ON gpt_analytics;
DROP POLICY IF EXISTS "Admins can view all GPTs" ON custom_gpts;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON subscribers;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create safe admin policies using the function
CREATE POLICY "Admins can view all analytics" ON daily_analytics
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all GPT analytics" ON gpt_analytics
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all GPTs" ON custom_gpts
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can view all subscribers" ON subscribers
FOR SELECT USING (public.is_current_user_admin());