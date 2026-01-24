-- Clean up redundant policies on integration_api_keys
-- Keep only the strict owner-only policies with consistent naming

-- Drop legacy/duplicate policies
DROP POLICY IF EXISTS "Users can manage their integration API keys" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_delete_owner" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_insert_owner" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_select_owner" ON public.integration_api_keys;
DROP POLICY IF EXISTS "iak_update_owner" ON public.integration_api_keys;

-- The following policies remain (already exist with strict auth.uid() = user_id):
-- integration_api_keys_select_own
-- integration_api_keys_insert_own
-- integration_api_keys_update_own
-- integration_api_keys_delete_own

-- Add a comment documenting the security model
COMMENT ON TABLE public.integration_api_keys IS 'Stores hashed API keys for third-party integrations. Keys are hashed using SHA-256 before storage. Only key_prefix is stored in plaintext for identification. Strict owner-only RLS policies enforce auth.uid() = user_id for all operations.';