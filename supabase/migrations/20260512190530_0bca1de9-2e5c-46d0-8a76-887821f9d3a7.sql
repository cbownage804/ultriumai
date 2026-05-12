
-- ============================================================
-- 1. Fix is_ultrium_employee privilege escalation
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_ultrium_employee(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
    AND (email LIKE '%@ultriumai.com' OR email LIKE '%@ultriumllc.com')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- Defense-in-depth: prevent users from updating their own profile email
CREATE OR REPLACE FUNCTION public.prevent_profile_email_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email
     AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Updating profile email is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_email_change ON public.profiles;
CREATE TRIGGER profiles_block_email_change
  BEFORE UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_email_change();

-- ============================================================
-- 2. vanguard_survey_tokens — remove public read
-- ============================================================
DROP POLICY IF EXISTS "Public can read tokens for validation" ON public.vanguard_survey_tokens;

CREATE OR REPLACE FUNCTION public.validate_vanguard_survey_token(_token text)
RETURNS TABLE (
  id uuid,
  ticket_id uuid,
  user_id uuid,
  is_used boolean,
  expires_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.ticket_id, t.user_id, t.is_used, t.expires_at
  FROM public.vanguard_survey_tokens t
  WHERE t.token = _token
    AND (t.expires_at IS NULL OR t.expires_at > now())
    AND COALESCE(t.is_used, false) = false
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_vanguard_survey_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_vanguard_survey_token(text) TO anon, authenticated;

-- ============================================================
-- 3. rmm_clipboard_sync — restrict to device owner
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage clipboard sync" ON public.rmm_clipboard_sync;

CREATE POLICY "Owners manage clipboard sync"
ON public.rmm_clipboard_sync
FOR ALL
TO authenticated
USING (
  device_id IN (
    SELECT d.id FROM public.rmm_devices d
    JOIN public.rmm_customers c ON c.id = d.customer_id
    WHERE c.user_id = auth.uid()
  )
)
WITH CHECK (
  device_id IN (
    SELECT d.id FROM public.rmm_devices d
    JOIN public.rmm_customers c ON c.id = d.customer_id
    WHERE c.user_id = auth.uid()
  )
);

-- ============================================================
-- 4. portal_password_reset_tokens — remove SELECT, add validator
-- ============================================================
DROP POLICY IF EXISTS "Select reset tokens for validation" ON public.portal_password_reset_tokens;

CREATE OR REPLACE FUNCTION public.validate_portal_reset_token(_token_hash text)
RETURNS TABLE (
  id uuid,
  portal_user_id uuid,
  expires_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.portal_user_id, t.expires_at
  FROM public.portal_password_reset_tokens t
  WHERE t.token_hash = _token_hash
    AND t.expires_at > now()
    AND COALESCE(t.used_at, NULL) IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_portal_reset_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_portal_reset_token(text) TO anon, authenticated;

-- ============================================================
-- 5. Co-managed tables — enforce organization membership
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_comanaged_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comanaged_organizations
    WHERE id = _org_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.comanaged_internal_technicians
    WHERE organization_id = _org_id
      AND (user_id = auth.uid() OR auth_user_id = auth.uid())
      AND COALESCE(is_active, true) = true
  );
$$;

-- Direct organization_id tables
DROP POLICY IF EXISTS "Authenticated users can access chat channels" ON public.comanaged_chat_channels;
CREATE POLICY "Org members access chat channels" ON public.comanaged_chat_channels
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access ticket notes" ON public.comanaged_ticket_notes;
CREATE POLICY "Org members access ticket notes" ON public.comanaged_ticket_notes
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access shift handoffs" ON public.comanaged_shift_handoffs;
CREATE POLICY "Org members access shift handoffs" ON public.comanaged_shift_handoffs
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access performance metrics" ON public.comanaged_performance_metrics;
CREATE POLICY "Org members access performance metrics" ON public.comanaged_performance_metrics
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Users can manage queues" ON public.comanaged_ticket_queues;
DROP POLICY IF EXISTS "Users can view queues for their organizations" ON public.comanaged_ticket_queues;
CREATE POLICY "Org members access ticket queues" ON public.comanaged_ticket_queues
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access oncall schedules" ON public.comanaged_oncall_schedules;
CREATE POLICY "Org members access oncall schedules" ON public.comanaged_oncall_schedules
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access skill routing" ON public.comanaged_skill_routing;
CREATE POLICY "Org members access skill routing" ON public.comanaged_skill_routing
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access escalation rules" ON public.comanaged_escalation_rules;
CREATE POLICY "Org members access escalation rules" ON public.comanaged_escalation_rules
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

DROP POLICY IF EXISTS "Authenticated users can access announcements" ON public.comanaged_announcements;
CREATE POLICY "Org members access announcements" ON public.comanaged_announcements
  FOR ALL TO authenticated
  USING (public.is_comanaged_org_member(organization_id))
  WITH CHECK (public.is_comanaged_org_member(organization_id));

-- Indirect: chat_messages -> chat_channels.organization_id
DROP POLICY IF EXISTS "Authenticated users can access chat messages" ON public.comanaged_chat_messages;
CREATE POLICY "Org members access chat messages" ON public.comanaged_chat_messages
  FOR ALL TO authenticated
  USING (channel_id IN (
    SELECT id FROM public.comanaged_chat_channels
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (channel_id IN (
    SELECT id FROM public.comanaged_chat_channels
    WHERE public.is_comanaged_org_member(organization_id)
  ));

-- queue_members / queue_tickets / queue_routing_rules -> ticket_queues.organization_id
DROP POLICY IF EXISTS "Users can manage queue members" ON public.comanaged_queue_members;
DROP POLICY IF EXISTS "Users can view queue members" ON public.comanaged_queue_members;
CREATE POLICY "Org members access queue members" ON public.comanaged_queue_members
  FOR ALL TO authenticated
  USING (queue_id IN (
    SELECT id FROM public.comanaged_ticket_queues
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (queue_id IN (
    SELECT id FROM public.comanaged_ticket_queues
    WHERE public.is_comanaged_org_member(organization_id)
  ));

DROP POLICY IF EXISTS "Users can manage queue tickets" ON public.comanaged_queue_tickets;
DROP POLICY IF EXISTS "Users can view queue tickets" ON public.comanaged_queue_tickets;
CREATE POLICY "Org members access queue tickets" ON public.comanaged_queue_tickets
  FOR ALL TO authenticated
  USING (queue_id IN (
    SELECT id FROM public.comanaged_ticket_queues
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (queue_id IN (
    SELECT id FROM public.comanaged_ticket_queues
    WHERE public.is_comanaged_org_member(organization_id)
  ));

DROP POLICY IF EXISTS "Users can manage routing rules" ON public.comanaged_queue_routing_rules;
DROP POLICY IF EXISTS "Users can view routing rules" ON public.comanaged_queue_routing_rules;
CREATE POLICY "Org members access routing rules" ON public.comanaged_queue_routing_rules
  FOR ALL TO authenticated
  USING (queue_id IN (
    SELECT id FROM public.comanaged_ticket_queues
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (queue_id IN (
    SELECT id FROM public.comanaged_ticket_queues
    WHERE public.is_comanaged_org_member(organization_id)
  ));

-- oncall_members / oncall_overrides -> oncall_schedules.organization_id
DROP POLICY IF EXISTS "Authenticated users can access oncall members" ON public.comanaged_oncall_members;
CREATE POLICY "Org members access oncall members" ON public.comanaged_oncall_members
  FOR ALL TO authenticated
  USING (schedule_id IN (
    SELECT id FROM public.comanaged_oncall_schedules
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (schedule_id IN (
    SELECT id FROM public.comanaged_oncall_schedules
    WHERE public.is_comanaged_org_member(organization_id)
  ));

DROP POLICY IF EXISTS "Authenticated users can access oncall overrides" ON public.comanaged_oncall_overrides;
CREATE POLICY "Org members access oncall overrides" ON public.comanaged_oncall_overrides
  FOR ALL TO authenticated
  USING (schedule_id IN (
    SELECT id FROM public.comanaged_oncall_schedules
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (schedule_id IN (
    SELECT id FROM public.comanaged_oncall_schedules
    WHERE public.is_comanaged_org_member(organization_id)
  ));

-- technician_skills -> internal_technicians.organization_id
DROP POLICY IF EXISTS "Authenticated users can access technician skills" ON public.comanaged_technician_skills;
CREATE POLICY "Org members access technician skills" ON public.comanaged_technician_skills
  FOR ALL TO authenticated
  USING (technician_id IN (
    SELECT id FROM public.comanaged_internal_technicians
    WHERE public.is_comanaged_org_member(organization_id)
  ))
  WITH CHECK (technician_id IN (
    SELECT id FROM public.comanaged_internal_technicians
    WHERE public.is_comanaged_org_member(organization_id)
  ));

-- announcement_reads -> announcements.organization_id; user owns their reads
DROP POLICY IF EXISTS "Authenticated users can track reads" ON public.comanaged_announcement_reads;
CREATE POLICY "Users manage own announcement reads" ON public.comanaged_announcement_reads
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND announcement_id IN (
      SELECT id FROM public.comanaged_announcements
      WHERE public.is_comanaged_org_member(organization_id)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND announcement_id IN (
      SELECT id FROM public.comanaged_announcements
      WHERE public.is_comanaged_org_member(organization_id)
    )
  );

-- editing_presence — restrict to user's own presence rows
DROP POLICY IF EXISTS "Authenticated users can track presence" ON public.comanaged_editing_presence;
CREATE POLICY "Users manage own editing presence" ON public.comanaged_editing_presence
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
