
-- Fix SafePass RLS: Replace overly simple user_id check with vault-level access control

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own SafePass entries" ON public.safepass_entries;

-- Create a security definer function to check vault access
CREATE OR REPLACE FUNCTION public.has_vault_access(_user_id uuid, _vault_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.safepass_vaults v
    WHERE v.id = _vault_id
    AND v.is_active = true
    AND (
      v.user_id = _user_id
      OR _user_id::text = ANY(
        SELECT jsonb_array_elements_text(v.shared_with)
      )
    )
  );
$$;

-- Create a security definer function to check vault ownership
CREATE OR REPLACE FUNCTION public.owns_vault(_user_id uuid, _vault_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.safepass_vaults v
    WHERE v.id = _vault_id
    AND v.user_id = _user_id
    AND v.is_active = true
  );
$$;

-- SELECT: User must own the vault or be in shared_with
CREATE POLICY "Users can view entries from accessible vaults"
ON public.safepass_entries
FOR SELECT
USING (
  user_id = auth.uid()
  AND public.has_vault_access(auth.uid(), vault_id)
);

-- INSERT: Only vault owner can insert entries, and user_id must match
CREATE POLICY "Users can insert entries in owned vaults"
ON public.safepass_entries
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND public.owns_vault(auth.uid(), vault_id)
);

-- UPDATE: Only vault owner can update entries
CREATE POLICY "Users can update entries in owned vaults"
ON public.safepass_entries
FOR UPDATE
USING (
  user_id = auth.uid()
  AND public.owns_vault(auth.uid(), vault_id)
);

-- DELETE: Only vault owner can delete entries
CREATE POLICY "Users can delete entries in owned vaults"
ON public.safepass_entries
FOR DELETE
USING (
  user_id = auth.uid()
  AND public.owns_vault(auth.uid(), vault_id)
);
