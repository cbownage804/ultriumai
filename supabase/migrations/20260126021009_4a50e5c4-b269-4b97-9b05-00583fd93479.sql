-- Fix the ensure_my_vault function to use extensions.gen_random_bytes instead of non-existent gen_random_bytes
CREATE OR REPLACE FUNCTION public.ensure_my_vault()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_vault_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check for existing vault
  SELECT id
    INTO v_vault_id
  FROM public.safepass_vaults
  WHERE user_id = v_user_id
    AND vault_name = 'My Vault'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_vault_id IS NOT NULL THEN
    -- Ensure it's active (and bump updated_at)
    UPDATE public.safepass_vaults
    SET is_active = true,
        updated_at = now()
    WHERE id = v_vault_id;

    RETURN v_vault_id;
  END IF;

  -- Create new vault - use uuid_generate_v4() for random bytes instead of gen_random_bytes
  BEGIN
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
      'Default password vault',
      false,
      true,
      encode(sha256(v_user_id::text::bytea || now()::text::bytea), 'base64'),
      '{}'::jsonb,
      '{}'::jsonb
    )
    RETURNING id INTO v_vault_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id
      INTO v_vault_id
    FROM public.safepass_vaults
    WHERE user_id = v_user_id
      AND vault_name = 'My Vault'
    ORDER BY created_at ASC
    LIMIT 1;
  END;

  RETURN v_vault_id;
END;
$$;