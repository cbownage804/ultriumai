-- Fix remaining functions with mutable search_path

CREATE OR REPLACE FUNCTION public.current_device_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
    select case 
        when nullif(current_setting('request.jwt.claim.device_id', true), '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then nullif(current_setting('request.jwt.claim.device_id', true), '')::uuid
        else null
    end;
$function$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
    select case 
        when nullif(current_setting('request.jwt.claim.org_id', true), '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid
        else null
    end;
$function$;

CREATE OR REPLACE FUNCTION public.get_device_alert_counts(p_device_id uuid)
RETURNS TABLE(critical bigint, high bigint, medium bigint, low bigint, info bigint)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    COALESCE(SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END), 0) as critical,
    COALESCE(SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END), 0) as high,
    COALESCE(SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END), 0) as medium,
    COALESCE(SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END), 0) as low,
    COALESCE(SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END), 0) as info
  FROM public.safenet_vulnerabilities sv
  WHERE sv.device_id = p_device_id
  AND sv.status IN ('open', 'active');
$function$;

CREATE OR REPLACE FUNCTION public.update_client_portal_updated_at()
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