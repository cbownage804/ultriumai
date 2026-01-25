-- Lock down publicly exposed views and tighten logging tables so security findings don't return

-- 1) profiles_safe: ensure invoker security + correct owner filter + no anon/public grants
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  full_name,
  avatar_url,
  account_type,
  created_at,
  updated_at
FROM public.profiles
WHERE auth.uid() = user_id;

REVOKE ALL PRIVILEGES ON TABLE public.profiles_safe FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.profiles_safe FROM public;
REVOKE ALL PRIVILEGES ON TABLE public.profiles_safe FROM authenticated;
GRANT SELECT ON TABLE public.profiles_safe TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.profiles_safe TO service_role;

-- 2) msp_billing_summary: invoker security so underlying RLS applies + remove anon/public grants
CREATE OR REPLACE VIEW public.msp_billing_summary
WITH (security_invoker = on)
AS
SELECT
  msp_id,
  billing_period,
  service_type,
  sum(quantity) AS total_quantity,
  sum(total_cost) AS total_cost,
  count(*) AS transaction_count,
  min(created_at) AS period_start,
  max(created_at) AS period_end
FROM public.msp_billing_usage
GROUP BY msp_id, billing_period, service_type;

REVOKE ALL PRIVILEGES ON TABLE public.msp_billing_summary FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.msp_billing_summary FROM public;
REVOKE ALL PRIVILEGES ON TABLE public.msp_billing_summary FROM authenticated;
GRANT SELECT ON TABLE public.msp_billing_summary TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.msp_billing_summary TO service_role;

-- 3) api_usage_logs: remove anon write/read, ensure only authenticated can read their own, and allow service_role to write
ALTER TABLE public.api_usage_logs FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.api_usage_logs FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.api_usage_logs FROM public;
REVOKE ALL PRIVILEGES ON TABLE public.api_usage_logs FROM authenticated;

GRANT SELECT ON TABLE public.api_usage_logs TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.api_usage_logs TO service_role;

DROP POLICY IF EXISTS "System can insert usage logs" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Users can view logs for their API keys" ON public.api_usage_logs;

CREATE POLICY "api_usage_logs_select_authenticated"
ON public.api_usage_logs
FOR SELECT
TO authenticated
USING (
  api_key_id IN (
    SELECT api_keys.id
    FROM public.api_keys
    WHERE api_keys.user_id = auth.uid()
  )
);

CREATE POLICY "api_usage_logs_insert_service_role"
ON public.api_usage_logs
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "api_usage_logs_select_service_role"
ON public.api_usage_logs
FOR SELECT
TO service_role
USING (true);

-- 4) msp_billing_usage: prevent anon access; allow authenticated read; allow service_role inserts
ALTER TABLE public.msp_billing_usage FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.msp_billing_usage FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.msp_billing_usage FROM public;

-- Keep authenticated read access for UI history
GRANT SELECT ON TABLE public.msp_billing_usage TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.msp_billing_usage TO service_role;

DROP POLICY IF EXISTS "System can insert billing usage" ON public.msp_billing_usage;
DROP POLICY IF EXISTS "MSPs can view their own billing usage" ON public.msp_billing_usage;
DROP POLICY IF EXISTS "MSPs can update their own billing usage" ON public.msp_billing_usage;

CREATE POLICY "msp_billing_usage_select_authenticated"
ON public.msp_billing_usage
FOR SELECT
TO authenticated
USING (
  msp_id = (
    SELECT (m.id)::text
    FROM public.msps m
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "msp_billing_usage_update_authenticated"
ON public.msp_billing_usage
FOR UPDATE
TO authenticated
USING (
  msp_id = (
    SELECT (m.id)::text
    FROM public.msps m
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "msp_billing_usage_insert_service_role"
ON public.msp_billing_usage
FOR INSERT
TO service_role
WITH CHECK (true);
