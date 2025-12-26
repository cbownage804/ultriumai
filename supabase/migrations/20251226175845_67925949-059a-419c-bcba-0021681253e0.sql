
-- Fix security warnings

-- 1. Add RLS to asset_categories
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view asset categories"
ON public.asset_categories
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Ensure safeweb_sources has RLS (may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'safeweb_sources' AND policyname = 'Authenticated users can view safeweb sources'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view safeweb sources" ON public.safeweb_sources FOR SELECT USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- 3. Fix functions with mutable search_path
CREATE OR REPLACE FUNCTION public.update_pricing_plans_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
