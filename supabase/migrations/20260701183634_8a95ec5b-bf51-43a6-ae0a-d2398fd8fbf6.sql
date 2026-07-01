
-- =========================================================
-- 1. client_portal_users: hide sensitive credential columns
-- =========================================================
REVOKE SELECT (temporary_password, password_hash, reset_token, mfa_secret, mfa_backup_codes)
  ON public.client_portal_users FROM anon, authenticated;

-- =========================================================
-- 2. comanaged_internal_technicians: hide password hash
-- =========================================================
REVOKE SELECT (password_hash)
  ON public.comanaged_internal_technicians FROM anon, authenticated;

-- =========================================================
-- 3. helpdesk_canned_responses: scope to same MSP as creator
-- =========================================================
CREATE OR REPLACE FUNCTION public.users_share_msp(_user_a uuid, _user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT id AS msp_id FROM public.msps WHERE user_id = _user_a
      UNION
      SELECT msp_id FROM public.msp_staff WHERE user_id = _user_a AND is_active = true
    ) a
    JOIN (
      SELECT id AS msp_id FROM public.msps WHERE user_id = _user_b
      UNION
      SELECT msp_id FROM public.msp_staff WHERE user_id = _user_b AND is_active = true
    ) b ON a.msp_id = b.msp_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.users_share_msp(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.users_share_msp(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated users can view canned responses" ON public.helpdesk_canned_responses;

CREATE POLICY "MSP members can view their MSP's canned responses"
ON public.helpdesk_canned_responses
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.users_share_msp(auth.uid(), created_by)
);

-- =========================================================
-- 4. ticket_satisfaction_ratings: scope to tenant/submitter
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view satisfaction ratings" ON public.ticket_satisfaction_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert satisfaction ratings" ON public.ticket_satisfaction_ratings;
DROP POLICY IF EXISTS "Users can update their own satisfaction ratings" ON public.ticket_satisfaction_ratings;

CREATE POLICY "View satisfaction ratings for own tickets or managed tenants"
ON public.ticket_satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  portal_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.helpdesk_tickets t
    JOIN public.msp_clients mc ON mc.id = t.customer_id
    WHERE t.id = ticket_satisfaction_ratings.ticket_id
      AND (
        EXISTS (SELECT 1 FROM public.msps m WHERE m.id = mc.msp_id AND m.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.msp_staff ms WHERE ms.msp_id = mc.msp_id AND ms.user_id = auth.uid() AND ms.is_active = true)
      )
  )
);

CREATE POLICY "Portal users insert their own satisfaction rating"
ON public.ticket_satisfaction_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  portal_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.helpdesk_tickets t WHERE t.id = ticket_id
  )
);

CREATE POLICY "Portal users update their own satisfaction rating"
ON public.ticket_satisfaction_ratings
FOR UPDATE
TO authenticated
USING (portal_user_id = auth.uid())
WITH CHECK (portal_user_id = auth.uid());

-- =========================================================
-- 5. Revoke execute from authenticated on server-only SECURITY DEFINER functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.deduct_ai_credits(uuid, uuid, integer, text, uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_number() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.send_notification(uuid, text, text, text, text, text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_device_from_checkin(text, text, jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_portal_activity(uuid, text, jsonb, inet, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_api_key(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_connector_key(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_connector_key_secure(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_portal_reset_token(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_vanguard_survey_token(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_next_run(text, time without time zone) FROM authenticated;
