-- Fix recurring security findings for profiles + msp_api_keys
-- Root cause: msp_api_keys currently has anon table privileges (relacl shows anon=arwdDxtm)

-- PROFILES: harden (should already be owner-only via policies)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM public;

-- MSP_API_KEYS: revoke anon/public grants and scope policy to authenticated
ALTER TABLE public.msp_api_keys FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.msp_api_keys FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.msp_api_keys FROM public;

-- Ensure authenticated retains necessary CRUD privileges for the app
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.msp_api_keys TO authenticated;

-- Replace overly-broad policy (role=public) with authenticated-only
DROP POLICY IF EXISTS "MSP can manage their API keys" ON public.msp_api_keys;
DROP POLICY IF EXISTS "msp_api_keys_manage_authenticated" ON public.msp_api_keys;

CREATE POLICY "msp_api_keys_manage_authenticated"
ON public.msp_api_keys
FOR ALL
TO authenticated
USING (
  msp_id IN (
    SELECT msps.id
    FROM public.msps
    WHERE msps.user_id = auth.uid()
  )
)
WITH CHECK (
  msp_id IN (
    SELECT msps.id
    FROM public.msps
    WHERE msps.user_id = auth.uid()
  )
);
