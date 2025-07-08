-- Create admin policies for related tables in AdminUsersManager

-- Admin policies for user_roles table
CREATE POLICY "Admins can view all user roles" ON user_roles
FOR SELECT USING (public.is_current_user_admin());

-- Admin policies for user_credits table  
CREATE POLICY "Admins can view all user credits" ON user_credits
FOR SELECT USING (public.is_current_user_admin());