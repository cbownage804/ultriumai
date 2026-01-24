-- Enable RLS on integration_api_keys
ALTER TABLE public.integration_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.integration_api_keys;
DROP POLICY IF EXISTS "Public read access" ON public.integration_api_keys;

-- Create strict owner-only policies
CREATE POLICY "integration_api_keys_select_own"
ON public.integration_api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "integration_api_keys_insert_own"
ON public.integration_api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_api_keys_update_own"
ON public.integration_api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_api_keys_delete_own"
ON public.integration_api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);