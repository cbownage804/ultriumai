-- Fix failed migration (uuid = text) + eliminate repeat findings

-- 1) MSP billing usage: enforce owner-only RLS (cast-safe)
ALTER TABLE public.msp_billing_usage ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public' AND tablename='msp_billing_usage'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.msp_billing_usage;', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "msp_billing_usage_owner_select"
ON public.msp_billing_usage
FOR SELECT
TO authenticated
USING (auth.uid()::text = msp_id::text);

CREATE POLICY "msp_billing_usage_owner_insert"
ON public.msp_billing_usage
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = msp_id::text);

CREATE POLICY "msp_billing_usage_owner_update"
ON public.msp_billing_usage
FOR UPDATE
TO authenticated
USING (auth.uid()::text = msp_id::text)
WITH CHECK (auth.uid()::text = msp_id::text);

CREATE POLICY "msp_billing_usage_owner_delete"
ON public.msp_billing_usage
FOR DELETE
TO authenticated
USING (auth.uid()::text = msp_id::text);

-- Recreate view as security_invoker + remove any public access
CREATE OR REPLACE VIEW public.msp_billing_summary
WITH (security_invoker = on) AS
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
GRANT SELECT ON TABLE public.msp_billing_summary TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.msp_billing_summary TO service_role;

-- 2) client_portal_users: drop ALL conflicting policies and deny all access for anon/authenticated
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname='public' AND tablename='client_portal_users'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.client_portal_users;', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "cpu_deny_anon_all"
ON public.client_portal_users
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "cpu_deny_authenticated_all"
ON public.client_portal_users
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Also ensure PostgREST can't read it even if policies change later
REVOKE ALL PRIVILEGES ON TABLE public.client_portal_users FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.client_portal_users FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.client_portal_users FROM public;
GRANT ALL PRIVILEGES ON TABLE public.client_portal_users TO service_role;

-- 3) client_portal_users_safe: keep non-public
CREATE OR REPLACE VIEW public.client_portal_users_safe
WITH (security_invoker = on) AS
SELECT
  id,
  client_id,
  email,
  full_name,
  role,
  is_active,
  last_login_at,
  created_at,
  updated_at
FROM public.client_portal_users;

REVOKE ALL PRIVILEGES ON TABLE public.client_portal_users_safe FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.client_portal_users_safe FROM public;
REVOKE ALL PRIVILEGES ON TABLE public.client_portal_users_safe FROM authenticated;
GRANT SELECT ON TABLE public.client_portal_users_safe TO service_role;
