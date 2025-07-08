-- Create comprehensive admin RLS policies for all admin dashboard tables

-- MSPs table admin policies
CREATE POLICY "Admins can view all MSPs" ON msps
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all MSPs" ON msps  
FOR UPDATE USING (public.is_current_user_admin());

-- MSP clients table admin policies
CREATE POLICY "Admins can view all MSP clients" ON msp_clients
FOR SELECT USING (public.is_current_user_admin());

-- Admin policies for custom_gpts (update and delete)
CREATE POLICY "Admins can update all GPTs" ON custom_gpts
FOR UPDATE USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete all GPTs" ON custom_gpts
FOR DELETE USING (public.is_current_user_admin());

-- Admin policies for subscribers (update)
CREATE POLICY "Admins can update all subscriptions" ON subscribers
FOR UPDATE USING (public.is_current_user_admin());

-- Admin policies for user_credits (update)
CREATE POLICY "Admins can update all user credits" ON user_credits
FOR UPDATE USING (public.is_current_user_admin());

-- Admin policies for profiles (update)
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (public.is_current_user_admin());

-- Admin policies for admin_audit_trails
CREATE POLICY "Admins can view admin audit trails" ON admin_audit_trails
FOR SELECT USING (public.is_current_user_admin());