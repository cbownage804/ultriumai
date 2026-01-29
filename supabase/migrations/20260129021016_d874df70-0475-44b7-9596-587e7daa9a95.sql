-- Drop the existing admin policy that uses user_roles table
DROP POLICY IF EXISTS "subscribers_admin_all" ON public.subscribers;

-- Create a new admin policy using the email-based admin check
CREATE POLICY "subscribers_admin_full_access" ON public.subscribers
  FOR ALL
  USING (
    -- User's own record OR admin user (email ends with @ultriumai.com)
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email LIKE '%@ultriumai.com'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email LIKE '%@ultriumai.com'
    )
  );