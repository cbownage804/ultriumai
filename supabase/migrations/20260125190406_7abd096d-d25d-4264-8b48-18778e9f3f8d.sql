-- Fix 1: Update threat_intelligence_feeds RLS policy to be more specific
DROP POLICY IF EXISTS "System can manage threat intelligence" ON public.threat_intelligence_feeds;

CREATE POLICY "Users can view threat intelligence feeds"
ON public.threat_intelligence_feeds FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Service role manages threat intelligence"
ON public.threat_intelligence_feeds FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Fix 2: Update subscription_grace_periods RLS policy
DROP POLICY IF EXISTS "System can manage grace periods" ON public.subscription_grace_periods;

CREATE POLICY "Users can view own grace periods"
ON public.subscription_grace_periods FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages grace periods"
ON public.subscription_grace_periods FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Fix 3: Tighten contact_messages policy (keep allowing submissions but restrict read)
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Service role can read contact messages"
ON public.contact_messages FOR SELECT TO service_role
USING (true);

-- Fix 4: Move vector extension to extensions schema (Supabase best practice)
CREATE SCHEMA IF NOT EXISTS extensions;
-- Note: Moving the extension requires superuser and may affect existing vector columns
-- This is typically handled via Supabase dashboard for safety

-- Fix 5: Fix update_updated_at_column function with immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;