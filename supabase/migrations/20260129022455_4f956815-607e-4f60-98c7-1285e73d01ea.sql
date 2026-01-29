BEGIN;

-- 1) Fix permissive lead capture policy + lock down lead visibility to admins
DROP POLICY IF EXISTS "Anyone can submit lead capture forms" ON public.lead_captures;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.lead_captures;

CREATE POLICY "Public can submit lead capture forms"
ON public.lead_captures
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) > 3
);

CREATE POLICY "Admins can view leads"
ON public.lead_captures
FOR SELECT
TO authenticated
USING (public.is_admin_user());

CREATE POLICY "Admins can update leads"
ON public.lead_captures
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 2) Add explicit RLS policies for contact_form_rate_limits (RLS was enabled with no policies)
-- Keep this table inaccessible to clients; edge function uses service role key.
CREATE POLICY "Service role manages contact form rate limits"
ON public.contact_form_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Deny authenticated access to contact form rate limits"
ON public.contact_form_rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny anonymous access to contact form rate limits"
ON public.contact_form_rate_limits
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3) Fix linter: function search_path mutable
CREATE OR REPLACE FUNCTION public.get_ai_studio_plan_credits(plan text)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO public
AS $$
BEGIN
  RETURN CASE plan
    -- MSP Plans
    WHEN 'msp_starter' THEN 50000
    WHEN 'msp_pro' THEN 200000
    WHEN 'msp_elite' THEN 500000
    -- Team Plans
    WHEN 'team_basic' THEN 20000
    WHEN 'team_plus' THEN 100000
    -- Website Plans
    WHEN 'website_basic' THEN 5000
    WHEN 'website_pro' THEN 20000
    -- Free tier
    ELSE 1000
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_credits_for_tier(tier text, is_subscribed boolean)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT is_subscribed THEN
    RETURN 0;  -- Free tier gets no monthly credits, only daily
  END IF;
  
  RETURN CASE tier
    WHEN 'enterprise' THEN 15000
    WHEN 'premium' THEN 5000
    WHEN 'pro' THEN 100
    ELSE 0
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_safepass_master_password_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMIT;