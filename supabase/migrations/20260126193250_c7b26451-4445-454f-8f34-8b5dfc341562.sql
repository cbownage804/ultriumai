-- Create function to check if user is admin (has @ultriumai.com email)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%@ultriumai.com'
  )
$$;

-- Add RLS policy for admins to view all security settings
CREATE POLICY "Admins can view all security settings" 
ON public.security_settings 
FOR SELECT 
TO authenticated
USING (public.is_admin_user());

-- Add RLS policy for admins to view all audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (public.is_admin_user());