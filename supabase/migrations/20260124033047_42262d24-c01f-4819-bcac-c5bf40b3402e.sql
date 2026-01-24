-- Create an idempotent default-vault helper to avoid duplicate 'My Vault' creation races
-- Uses auth.uid() (no user_id param) to prevent privilege escalation.
create or replace function public.ensure_my_vault()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_vault_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id
    into v_vault_id
  from public.safepass_vaults
  where user_id = v_user_id
    and vault_name = 'My Vault'
  order by created_at asc
  limit 1;

  if v_vault_id is not null then
    -- Ensure it's active (and bump updated_at)
    update public.safepass_vaults
    set is_active = true,
        updated_at = now()
    where id = v_vault_id;

    return v_vault_id;
  end if;

  begin
    insert into public.safepass_vaults (
      user_id,
      vault_name,
      description,
      is_shared,
      is_active,
      encryption_key_hash,
      access_policies,
      shared_with
    ) values (
      v_user_id,
      'My Vault',
      'Default password vault',
      false,
      true,
      encode(gen_random_bytes(32), 'base64'),
      '{}'::jsonb,
      '{}'::jsonb
    )
    returning id into v_vault_id;
  exception when unique_violation then
    select id
      into v_vault_id
    from public.safepass_vaults
    where user_id = v_user_id
      and vault_name = 'My Vault'
    order by created_at asc
    limit 1;
  end;

  return v_vault_id;
end;
$$;

revoke all on function public.ensure_my_vault() from public;
grant execute on function public.ensure_my_vault() to authenticated;

-- Tighten policies to authenticated only (prevents any anon edge cases & satisfies scanners)
drop policy if exists "Users can manage their own SafePass vaults" on public.safepass_vaults;
create policy "Users can manage their own SafePass vaults"
on public.safepass_vaults
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage their security incidents" on public.security_incidents;
create policy "Users can manage their security incidents"
on public.security_incidents
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
