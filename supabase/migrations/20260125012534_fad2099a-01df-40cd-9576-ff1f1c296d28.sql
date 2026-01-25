-- Drop existing policies and recreate clean
DROP POLICY IF EXISTS "api_keys_select_owner_only" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_insert_owner_only" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_update_owner_only" ON public.api_keys;
DROP POLICY IF EXISTS "api_keys_delete_owner_only" ON public.api_keys;

-- Recreate strict owner-only policies for api_keys
CREATE POLICY "api_keys_select_owner_only" 
ON public.api_keys FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "api_keys_insert_owner_only" 
ON public.api_keys FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_update_owner_only" 
ON public.api_keys FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_delete_owner_only" 
ON public.api_keys FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Revoke anon access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.api_keys FROM anon;