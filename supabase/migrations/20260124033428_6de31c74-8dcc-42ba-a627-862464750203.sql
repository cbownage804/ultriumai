-- Harden profiles_safe to prevent user enumeration
-- Views don't support RLS directly; instead we constrain the view itself and rely on invoker security.

create or replace view public.profiles_safe
with (security_invoker=on) as
select
  id,
  user_id,
  full_name,
  avatar_url,
  account_type,
  created_at,
  updated_at
from public.profiles
where auth.uid() = id;

-- Ensure the view is not publicly selectable
revoke all on table public.profiles_safe from public;
revoke all on table public.profiles_safe from anon;
revoke all on table public.profiles_safe from authenticated;

grant select on table public.profiles_safe to authenticated;
