-- Quick fixes for remaining tables
DROP POLICY IF EXISTS "System can manage scan results" ON public.safedoc_scan_results;
DROP POLICY IF EXISTS "System can manage breach database" ON public.safepass_breach_database;
DROP POLICY IF EXISTS "System can manage sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;

-- Read-only policies for reference/lookup tables
CREATE POLICY "spbd_select" ON public.safepass_breach_database FOR SELECT TO authenticated USING (true);
CREATE POLICY "sws_select" ON public.safeweb_sources FOR SELECT TO authenticated USING (true);

-- subscribers - owner only
CREATE POLICY "sub_select" ON public.subscribers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sub_insert" ON public.subscribers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);