-- Create a security definer function to check if a user can access a safepass entry
-- This prevents RLS recursion and centralizes access control logic
CREATE OR REPLACE FUNCTION public.can_access_safepass_entry(entry_id UUID, checking_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry_record RECORD;
  vault_owner_id UUID;
BEGIN
  -- Get the entry details
  SELECT e.user_id, e.vault_id INTO entry_record
  FROM public.safepass_entries e
  WHERE e.id = entry_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check 1: User owns the entry directly
  IF entry_record.user_id = checking_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check 2: User owns the vault containing the entry
  SELECT v.user_id INTO vault_owner_id
  FROM public.safepass_vaults v
  WHERE v.id = entry_record.vault_id;
  
  IF vault_owner_id = checking_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check 3: Entry is directly shared with the user via safepass_shared_access
  IF EXISTS (
    SELECT 1 FROM public.safepass_shared_access sa
    WHERE sa.entry_id = entry_id
    AND sa.shared_with_user_id = checking_user_id
    AND (sa.expires_at IS NULL OR sa.expires_at > now())
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check 4: Vault is shared with a team the user belongs to
  IF EXISTS (
    SELECT 1 
    FROM public.safepass_shared_vaults sv
    JOIN public.safepass_team_memberships tm ON sv.team_id = tm.team_id
    WHERE sv.vault_id = entry_record.vault_id
    AND tm.user_id = checking_user_id
    AND tm.is_active = true
    AND sv.is_active = true
    AND (sv.expires_at IS NULL OR sv.expires_at > now())
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check 5: Vault is directly shared with the user
  IF EXISTS (
    SELECT 1 FROM public.safepass_shared_access sa
    WHERE sa.vault_id = entry_record.vault_id
    AND sa.entry_id IS NULL
    AND sa.shared_with_user_id = checking_user_id
    AND (sa.expires_at IS NULL OR sa.expires_at > now())
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create a simpler function to check entry ownership for INSERT/UPDATE/DELETE
CREATE OR REPLACE FUNCTION public.owns_safepass_entry(checking_user_id UUID, entry_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entry_user_id = checking_user_id;
$$;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can manage their own SafePass entries" ON public.safepass_entries;

-- Create separate policies for each operation with proper access control

-- SELECT: Allow reading entries user owns, or has shared access to
CREATE POLICY "safepass_entries_select_policy" 
ON public.safepass_entries 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  public.can_access_safepass_entry(id, auth.uid())
);

-- INSERT: Only allow inserting entries for vaults the user owns
CREATE POLICY "safepass_entries_insert_policy" 
ON public.safepass_entries 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  vault_id IN (SELECT id FROM public.safepass_vaults WHERE user_id = auth.uid())
);

-- UPDATE: Only allow updating entries the user owns
CREATE POLICY "safepass_entries_update_policy" 
ON public.safepass_entries 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Only allow deleting entries the user owns
CREATE POLICY "safepass_entries_delete_policy" 
ON public.safepass_entries 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());