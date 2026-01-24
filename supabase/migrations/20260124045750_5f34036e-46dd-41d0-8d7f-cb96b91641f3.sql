-- Create the ensure_my_vault function for idempotent vault creation
CREATE OR REPLACE FUNCTION public.ensure_my_vault()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vault_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Try to find existing "My Vault"
  SELECT id INTO v_vault_id
  FROM public.safepass_vaults
  WHERE user_id = v_user_id
  AND vault_name = 'My Vault'
  LIMIT 1;
  
  -- If found, return it
  IF v_vault_id IS NOT NULL THEN
    RETURN v_vault_id;
  END IF;
  
  -- Otherwise, create new vault
  INSERT INTO public.safepass_vaults (
    user_id,
    vault_name,
    description,
    is_shared,
    is_active,
    encryption_key_hash,
    access_policies,
    shared_with
  ) VALUES (
    v_user_id,
    'My Vault',
    'Personal password vault',
    false,
    true,
    encode(gen_random_bytes(32), 'base64'),
    '{}',
    '{}'
  )
  RETURNING id INTO v_vault_id;
  
  RETURN v_vault_id;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: vault was created by another request
    SELECT id INTO v_vault_id
    FROM public.safepass_vaults
    WHERE user_id = v_user_id
    AND vault_name = 'My Vault'
    LIMIT 1;
    RETURN v_vault_id;
END;
$$;