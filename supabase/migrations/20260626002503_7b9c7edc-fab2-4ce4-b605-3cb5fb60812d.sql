
DROP POLICY IF EXISTS "MSPs can manage alert patterns" ON public.alert_patterns;
CREATE POLICY "Ultrium employees manage alert patterns"
  ON public.alert_patterns FOR ALL TO authenticated
  USING (public.is_ultrium_employee(auth.uid()))
  WITH CHECK (public.is_ultrium_employee(auth.uid()));
CREATE POLICY "MSP users can view alert patterns"
  ON public.alert_patterns FOR SELECT TO authenticated
  USING (public.is_msp_user(auth.uid()) OR public.is_ultrium_employee(auth.uid()));

DROP POLICY IF EXISTS "Users can access their own MITRE mappings" ON public.mitre_attack_mappings;
CREATE POLICY "Authorized staff manage MITRE mappings"
  ON public.mitre_attack_mappings FOR ALL TO authenticated
  USING (public.is_ultrium_employee(auth.uid()) OR public.is_msp_user(auth.uid()))
  WITH CHECK (public.is_ultrium_employee(auth.uid()) OR public.is_msp_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can manage file transfers" ON public.rmm_file_transfers;
CREATE POLICY "Owners and staff manage RMM file transfers"
  ON public.rmm_file_transfers FOR ALL TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rmm_devices d
      JOIN public.rmm_customers c ON c.id = d.customer_id
      WHERE d.id = rmm_file_transfers.device_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_ultrium_employee(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rmm_devices d
      JOIN public.rmm_customers c ON c.id = d.customer_id
      WHERE d.id = rmm_file_transfers.device_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view session events" ON public.rmm_session_events;
CREATE POLICY "Owners and staff view RMM session events"
  ON public.rmm_session_events FOR SELECT TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rmm_devices d
      JOIN public.rmm_customers c ON c.id = d.customer_id
      WHERE d.id = rmm_session_events.device_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage quarantine" ON public.safedoc_quarantine;
CREATE POLICY "Owners and staff manage quarantine"
  ON public.safedoc_quarantine FOR ALL TO authenticated
  USING (
    public.is_ultrium_employee(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rmm_devices d
      JOIN public.rmm_customers c ON c.id = d.customer_id
      WHERE d.id = safedoc_quarantine.device_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_ultrium_employee(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rmm_devices d
      JOIN public.rmm_customers c ON c.id = d.customer_id
      WHERE d.id = safedoc_quarantine.device_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "MSP can manage SLA policies" ON public.sla_policies;
CREATE POLICY "Ultrium employees manage SLA policies"
  ON public.sla_policies FOR ALL TO authenticated
  USING (public.is_ultrium_employee(auth.uid()))
  WITH CHECK (public.is_ultrium_employee(auth.uid()));
CREATE POLICY "MSP users can view SLA policies"
  ON public.sla_policies FOR SELECT TO authenticated
  USING (public.is_msp_user(auth.uid()) OR public.is_ultrium_employee(auth.uid()));

CREATE POLICY "Authors and staff can create KB articles"
  ON public.helpdesk_kb_articles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND (public.is_ultrium_employee(auth.uid()) OR public.is_msp_user(auth.uid()))
  );
CREATE POLICY "Authors and staff can update KB articles"
  ON public.helpdesk_kb_articles FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR public.is_ultrium_employee(auth.uid()))
  WITH CHECK (auth.uid() = author_id OR public.is_ultrium_employee(auth.uid()));
CREATE POLICY "Staff can delete KB articles"
  ON public.helpdesk_kb_articles FOR DELETE TO authenticated
  USING (public.is_ultrium_employee(auth.uid()));

REVOKE SELECT ON public.client_portal_users FROM authenticated;
GRANT SELECT (id, client_id, role, is_active, created_at, updated_at) ON public.client_portal_users TO authenticated;

CREATE POLICY "Service role manages meshcentral_servers"
  ON public.meshcentral_servers FOR ALL
  USING (public.is_service_role()) WITH CHECK (public.is_service_role());
CREATE POLICY "Deny direct meshcentral_servers access"
  ON public.meshcentral_servers FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Service role manages password reset tokens"
  ON public.portal_password_reset_tokens FOR ALL
  USING (public.is_service_role()) WITH CHECK (public.is_service_role());
CREATE POLICY "Deny direct password reset token access"
  ON public.portal_password_reset_tokens FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Bug screenshots are publicly readable" ON storage.objects;
CREATE POLICY "Bug screenshots owner or staff read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.is_ultrium_employee(auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete videos" ON storage.objects;
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
CREATE POLICY "Authenticated upload videos to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners update their videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete their videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated read videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Portal users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Portal users can view attachments" ON storage.objects;
CREATE POLICY "Authenticated upload ticket attachments to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-attachments' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners and staff read ticket attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ticket-attachments'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.is_ultrium_employee(auth.uid())
      OR public.is_msp_user(auth.uid())
    )
  );

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname='Authenticated can use realtime channels') THEN
    EXECUTE 'CREATE POLICY "Authenticated can use realtime channels" ON realtime.messages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='realtime' AND tablename='messages' AND policyname='Authenticated can publish realtime messages') THEN
    EXECUTE 'CREATE POLICY "Authenticated can publish realtime messages" ON realtime.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END
$do$;

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION vector SET SCHEMA extensions;

DO $outer$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    WHERE p.prosecdef = true AND n.nspname='public'
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
                     r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END
$outer$;

DO $outer$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    WHERE p.prosecdef = true AND n.nspname='public'
      AND p.proname IN (
        'cleanup_old_document_scans','cleanup_old_rate_limits','cleanup_old_security_scans',
        'auto_provision_meshcentral','create_default_safesuite_settings',
        'create_portal_user_for_contact','create_portal_user_permissions',
        'grant_default_product_access','handle_new_team','handle_new_user',
        'handle_new_user_role','handle_new_user_safesuite_subscription',
        'initialize_org_credits','rls_auto_enable','setup_user_subscription_defaults',
        'save_password_history','log_asset_changes','log_ticket_activity',
        'prevent_profile_email_change','set_updated_at','auto_add_org_team_owner',
        'auto_add_team_owner','auto_assign_org_admin','create_lead_on_signup',
        'create_incident_from_event','create_ticket_from_rmm_alert','assign_sla_to_ticket'
      )
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated',
                     r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END
$outer$;
