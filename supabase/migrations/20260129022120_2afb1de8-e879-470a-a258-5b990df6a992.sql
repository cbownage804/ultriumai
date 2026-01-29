-- Fix admin RLS on subscribers: avoid direct auth.users reference (caused 403 permission denied)
BEGIN;

-- Replace the broken admin policy that queries auth.users directly
DROP POLICY IF EXISTS "subscribers_admin_full_access" ON public.subscribers;

CREATE POLICY "subscribers_admin_full_access"
ON public.subscribers
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_admin_user()
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin_user()
);

-- Hardening: user_id should never be nullable if it's used for access control
ALTER TABLE public.subscribers
  ALTER COLUMN user_id SET NOT NULL;

COMMIT;