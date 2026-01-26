-- =====================================================
-- FIX VANGUARD_AGENTS: Change from 'public' to 'authenticated' role
-- =====================================================

-- Drop old policies that target 'public' role (includes anon!)
DROP POLICY IF EXISTS "Users can delete their own vanguard agents" ON public.vanguard_agents;
DROP POLICY IF EXISTS "Users can insert their own vanguard agents" ON public.vanguard_agents;
DROP POLICY IF EXISTS "Users can view their own vanguard agents" ON public.vanguard_agents;
DROP POLICY IF EXISTS "Users can update their own vanguard agents" ON public.vanguard_agents;

-- Recreate with 'authenticated' role only
CREATE POLICY "authenticated_view_own_agents"
  ON public.vanguard_agents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "authenticated_insert_own_agents"
  ON public.vanguard_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_update_own_agents"
  ON public.vanguard_agents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_delete_own_agents"
  ON public.vanguard_agents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Explicitly deny anonymous access
DROP POLICY IF EXISTS "deny_anon_vanguard_agents" ON public.vanguard_agents;
CREATE POLICY "deny_anon_vanguard_agents"
  ON public.vanguard_agents
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- =====================================================
-- VERIFY: business_customers already has correct policies
-- but ensure anon denial is in place
-- =====================================================

-- Already exists from earlier migration, but ensure it's there
DROP POLICY IF EXISTS "deny_anon_business_customers" ON public.business_customers;
CREATE POLICY "deny_anon_business_customers"
  ON public.business_customers
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);