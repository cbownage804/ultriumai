-- Harden password_entries RLS policies
-- Remove public role access, restrict to authenticated only
-- Remove direct shared_with array check (too easy to exploit)

drop policy if exists "Users can view their password entries or MSP client entries" on public.password_entries;
drop policy if exists "Users can create password entries in their vaults" on public.password_entries;
drop policy if exists "Users can update their own password entries" on public.password_entries;
drop policy if exists "Users can delete their own password entries" on public.password_entries;

-- Create secure function to check password entry access
create or replace function public.can_access_password_entry(p_entry_id uuid, p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_entry record;
  v_vault record;
begin
  -- Get entry details
  select user_id, vault_id into v_entry
  from public.password_entries
  where id = p_entry_id;
  
  if not found then
    return false;
  end if;
  
  -- Check 1: User owns the entry directly
  if v_entry.user_id = p_user_id then
    return true;
  end if;
  
  -- Check 2: User owns the vault
  select user_id, team_id, msp_client_id into v_vault
  from public.password_vaults
  where id = v_entry.vault_id;
  
  if v_vault.user_id = p_user_id then
    return true;
  end if;
  
  -- Check 3: User is a member of the vault's team
  if v_vault.team_id is not null and public.is_team_member(p_user_id, v_vault.team_id) then
    return true;
  end if;
  
  -- Check 4: User is an MSP owner for this client
  if v_vault.msp_client_id is not null then
    if exists (
      select 1
      from public.msp_clients mc
      join public.msps m on mc.msp_id = m.id
      where mc.id = v_vault.msp_client_id
      and m.user_id = p_user_id
    ) then
      return true;
    end if;
  end if;
  
  return false;
end;
$$;

-- New hardened policies for password_entries (authenticated only)
create policy "password_entries_select_policy"
on public.password_entries
for select
to authenticated
using (
  user_id = auth.uid() 
  or can_access_password_entry(id, auth.uid())
);

create policy "password_entries_insert_policy"
on public.password_entries
for insert
to authenticated
with check (
  user_id = auth.uid()
  and vault_id in (
    select id from public.password_vaults
    where user_id = auth.uid()
       or (team_id is not null and public.is_team_member(auth.uid(), team_id))
  )
);

create policy "password_entries_update_policy"
on public.password_entries
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "password_entries_delete_policy"
on public.password_entries
for delete
to authenticated
using (user_id = auth.uid());

-- Ensure safepass_entries policies are also properly scoped
-- They already use authenticated role and can_access_safepass_entry, but let's verify sharing is secure

-- Update the can_access_safepass_entry function to be more defensive
create or replace function public.can_access_safepass_entry(entry_id uuid, checking_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  entry_record record;
  vault_owner_id uuid;
begin
  -- Null check
  if entry_id is null or checking_user_id is null then
    return false;
  end if;

  -- Get the entry details
  select e.user_id, e.vault_id into entry_record
  from public.safepass_entries e
  where e.id = entry_id;
  
  if not found then
    return false;
  end if;
  
  -- Check 1: User owns the entry directly
  if entry_record.user_id = checking_user_id then
    return true;
  end if;
  
  -- Check 2: User owns the vault containing the entry
  select v.user_id into vault_owner_id
  from public.safepass_vaults v
  where v.id = entry_record.vault_id;
  
  if vault_owner_id = checking_user_id then
    return true;
  end if;
  
  -- Check 3: Entry is directly shared with the user via safepass_shared_access
  -- AND the share is still valid (not expired)
  if exists (
    select 1 from public.safepass_shared_access sa
    where sa.entry_id = can_access_safepass_entry.entry_id
    and sa.shared_with_user_id = checking_user_id
    and sa.is_active = true
    and (sa.expires_at is null or sa.expires_at > now())
  ) then
    return true;
  end if;
  
  -- Check 4: Vault is shared with a team the user belongs to (via safepass_shared_vaults)
  if exists (
    select 1 
    from public.safepass_shared_vaults sv
    join public.safepass_team_memberships tm on sv.team_id = tm.team_id
    where sv.vault_id = entry_record.vault_id
    and tm.user_id = checking_user_id
    and tm.is_active = true
    and sv.is_active = true
    and (sv.expires_at is null or sv.expires_at > now())
  ) then
    return true;
  end if;
  
  -- Check 5: Vault is directly shared with the user (vault-level share, not entry-level)
  if exists (
    select 1 from public.safepass_shared_access sa
    where sa.vault_id = entry_record.vault_id
    and sa.entry_id is null
    and sa.shared_with_user_id = checking_user_id
    and sa.is_active = true
    and (sa.expires_at is null or sa.expires_at > now())
  ) then
    return true;
  end if;
  
  return false;
end;
$$;
