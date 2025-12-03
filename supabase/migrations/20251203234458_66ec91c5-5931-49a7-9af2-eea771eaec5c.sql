-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all user presence" ON public.user_presence;

-- Create secure policy - users can only view their own presence
CREATE POLICY "Users can view own presence"
ON public.user_presence
FOR SELECT
USING (auth.uid() = user_id);