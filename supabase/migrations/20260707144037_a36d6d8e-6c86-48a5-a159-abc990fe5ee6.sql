
REVOKE SELECT, UPDATE ON public.client_portal_users FROM authenticated;

GRANT SELECT (
  id, client_id, email, full_name, role, is_active, last_login_at,
  created_at, updated_at, contact_id, must_change_password, login_count,
  failed_login_attempts, locked_until, mfa_enabled, mfa_verified_at,
  invited_by, invited_at
) ON public.client_portal_users TO authenticated;

GRANT UPDATE (
  full_name, is_active, last_login_at, login_count, mfa_enabled
) ON public.client_portal_users TO authenticated;

DROP POLICY IF EXISTS "Authenticated can publish realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can use realtime channels" ON realtime.messages;
