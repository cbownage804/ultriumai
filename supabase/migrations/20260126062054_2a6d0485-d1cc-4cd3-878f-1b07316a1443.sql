-- Clean up security_api_keys policies - already properly configured but let's ensure anon is fully blocked
-- The existing policies are correct, just need to revoke any grants to anon/public roles

REVOKE ALL ON public.security_api_keys FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_api_keys TO authenticated;

-- Clean up subscribers table - too many duplicate/overlapping policies
-- Remove duplicates and consolidate

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "UltriumAI employees can manage all subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription by email" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription by user_id" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "sub_insert" ON public.subscribers;
DROP POLICY IF EXISTS "sub_select" ON public.subscribers;

-- Create clean, consolidated policies for subscribers
-- Users can only view their own subscription
CREATE POLICY "subscribers_select_own"
ON public.subscribers FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = auth.email());

-- Users can insert their own subscription
CREATE POLICY "subscribers_insert_own"
ON public.subscribers FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own subscription
CREATE POLICY "subscribers_update_own"
ON public.subscribers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can manage all subscriptions (using existing admin function)
CREATE POLICY "subscribers_admin_all"
ON public.subscribers FOR ALL
TO authenticated
USING (is_current_user_admin());

-- Block anon access completely
DROP POLICY IF EXISTS "deny_anon_subscribers" ON public.subscribers;
CREATE POLICY "deny_anon_subscribers"
ON public.subscribers FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke any direct grants
REVOKE ALL ON public.subscribers FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON public.subscribers TO authenticated;