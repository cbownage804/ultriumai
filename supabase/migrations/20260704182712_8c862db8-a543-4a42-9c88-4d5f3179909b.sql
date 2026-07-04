
-- Fix 1: messages table - drop broad authenticated policies if they still exist
DROP POLICY IF EXISTS "Authenticated can use realtime channels" ON public.messages;
DROP POLICY IF EXISTS "Authenticated can publish realtime messages" ON public.messages;

-- Fix 2: client_portal_users - remove co-portal-user branch that leaks MFA secrets/password hashes
DROP POLICY IF EXISTS "Authenticated users can view client portal users they manage" ON public.client_portal_users;
DROP POLICY IF EXISTS "Deny direct client portal user access" ON public.client_portal_users;

CREATE POLICY "Users, MSP owners and MSP staff can view portal users"
ON public.client_portal_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM msp_clients mc
    JOIN msps m ON mc.msp_id = m.id
    WHERE mc.id = client_portal_users.client_id
      AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM msp_staff ms
    JOIN msp_clients mc ON mc.msp_id = ms.msp_id
    WHERE mc.id = client_portal_users.client_id
      AND ms.user_id = auth.uid()
      AND ms.is_active = true
  )
);

-- Fix 3: revoke anon EXECUTE on SECURITY DEFINER helpers not meant to be public.
-- Keep resolve_teams_tenant_org callable by anon (used by public Teams embed).
REVOKE EXECUTE ON FUNCTION public.ray_policies_snapshot_version() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.users_share_msp(uuid, uuid) FROM anon, PUBLIC;
