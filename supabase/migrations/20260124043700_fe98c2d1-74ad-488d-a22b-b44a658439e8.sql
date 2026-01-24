-- =============================================================================
-- Security Hardening Migration: API keys and sensitive tables
-- =============================================================================

-- 1. Harden API keys tables
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "ak_select_owner" ON public.api_keys;
DROP POLICY IF EXISTS "ak_insert_owner" ON public.api_keys;
DROP POLICY IF EXISTS "ak_update_owner" ON public.api_keys;
DROP POLICY IF EXISTS "ak_delete_owner" ON public.api_keys;

CREATE POLICY "ak_select_owner" ON public.api_keys 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ak_insert_owner" ON public.api_keys 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ak_update_owner" ON public.api_keys 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "ak_delete_owner" ON public.api_keys 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Harden payment_transactions - owner-only
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "pt_select_owner" ON public.payment_transactions;
DROP POLICY IF EXISTS "pt_insert_owner" ON public.payment_transactions;

CREATE POLICY "pt_select_owner" ON public.payment_transactions 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "pt_insert_owner" ON public.payment_transactions 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Harden vanguard_agent_credentials - owner-only
DROP POLICY IF EXISTS "Users can manage their own credentials" ON public.vanguard_agent_credentials;
DROP POLICY IF EXISTS "vac_select_owner" ON public.vanguard_agent_credentials;
DROP POLICY IF EXISTS "vac_insert_owner" ON public.vanguard_agent_credentials;
DROP POLICY IF EXISTS "vac_update_owner" ON public.vanguard_agent_credentials;
DROP POLICY IF EXISTS "vac_delete_owner" ON public.vanguard_agent_credentials;

CREATE POLICY "vac_select_owner" ON public.vanguard_agent_credentials 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "vac_insert_owner" ON public.vanguard_agent_credentials 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vac_update_owner" ON public.vanguard_agent_credentials 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "vac_delete_owner" ON public.vanguard_agent_credentials 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Harden gpt_integrations - owner-only
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.gpt_integrations;
DROP POLICY IF EXISTS "gi_select_owner" ON public.gpt_integrations;
DROP POLICY IF EXISTS "gi_insert_owner" ON public.gpt_integrations;
DROP POLICY IF EXISTS "gi_update_owner" ON public.gpt_integrations;
DROP POLICY IF EXISTS "gi_delete_owner" ON public.gpt_integrations;

CREATE POLICY "gi_select_owner" ON public.gpt_integrations 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "gi_insert_owner" ON public.gpt_integrations 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gi_update_owner" ON public.gpt_integrations 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "gi_delete_owner" ON public.gpt_integrations 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Harden security_api_keys - owner-only
DROP POLICY IF EXISTS "Users can manage their own security keys" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_select_owner" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_insert_owner" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_update_owner" ON public.security_api_keys;
DROP POLICY IF EXISTS "sak_delete_owner" ON public.security_api_keys;

CREATE POLICY "sak_select_owner" ON public.security_api_keys 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "sak_insert_owner" ON public.security_api_keys 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sak_update_owner" ON public.security_api_keys 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "sak_delete_owner" ON public.security_api_keys 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Harden integration_api_keys - owner-only
DROP POLICY IF EXISTS "Users can manage their own integration keys" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_select_owner" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_insert_owner" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_update_owner" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_delete_owner" ON public.integration_api_keys;

CREATE POLICY "iak_select_owner" ON public.integration_api_keys 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "iak_insert_owner" ON public.integration_api_keys 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "iak_update_owner" ON public.integration_api_keys 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "iak_delete_owner" ON public.integration_api_keys 
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Harden business_customers - owner-only
DROP POLICY IF EXISTS "Users can view their own business" ON public.business_customers;
DROP POLICY IF EXISTS "bc_select_owner" ON public.business_customers;
DROP POLICY IF EXISTS "bc_insert_owner" ON public.business_customers;
DROP POLICY IF EXISTS "bc_update_owner" ON public.business_customers;

CREATE POLICY "bc_select_owner" ON public.business_customers 
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "bc_insert_owner" ON public.business_customers 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bc_update_owner" ON public.business_customers 
FOR UPDATE TO authenticated USING (auth.uid() = user_id);