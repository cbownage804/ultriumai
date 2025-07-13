-- Fix search path warnings for all functions by adding proper search_path settings

-- Update permissions function
CREATE OR REPLACE FUNCTION public.update_permissions_updated_at_column()
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

-- Cleanup old document scans function
CREATE OR REPLACE FUNCTION public.cleanup_old_document_scans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Delete old scans for the user, keeping only the 20 most recent
  DELETE FROM document_scans 
  WHERE user_id = NEW.user_id 
  AND id NOT IN (
    SELECT id 
    FROM document_scans 
    WHERE user_id = NEW.user_id 
    ORDER BY created_at DESC 
    LIMIT 20
  );
  
  RETURN NEW;
END;
$function$;

-- Team member check function
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE user_id = _user_id 
    AND team_id = _team_id 
    AND is_active = true
  )
$function$;

-- Update workflow automations function
CREATE OR REPLACE FUNCTION public.update_workflow_automations_updated_at()
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

-- Update business updated at function
CREATE OR REPLACE FUNCTION public.update_business_updated_at_column()
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

-- Cleanup old security scans function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_scans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Delete old security scans for the user, keeping only the 20 most recent
  DELETE FROM gpt_analytics 
  WHERE user_id = NEW.user_id 
  AND interaction_type = 'security_scan'
  AND id NOT IN (
    SELECT id 
    FROM gpt_analytics 
    WHERE user_id = NEW.user_id 
    AND interaction_type = 'security_scan'
    ORDER BY created_at DESC 
    LIMIT 20
  );
  
  RETURN NEW;
END;
$function$;

-- Validate API key function
CREATE OR REPLACE FUNCTION public.validate_api_key(key_hash text)
RETURNS TABLE(user_id uuid, is_valid boolean, rate_limit_rpd integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    ak.user_id,
    (ak.is_active AND (ak.expires_at IS NULL OR ak.expires_at > now())) as is_valid,
    ak.rate_limit_rpd
  FROM public.api_keys ak
  WHERE ak.key_hash = validate_api_key.key_hash;
$function$;

-- Calculate next run function
CREATE OR REPLACE FUNCTION public.calculate_next_run(frequency text, schedule_time time without time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT 
    CASE 
      WHEN frequency = 'daily' THEN 
        (CURRENT_DATE + INTERVAL '1 day' + schedule_time)::TIMESTAMP WITH TIME ZONE
      WHEN frequency = 'weekly' THEN 
        (CURRENT_DATE + INTERVAL '7 days' + schedule_time)::TIMESTAMP WITH TIME ZONE
      WHEN frequency = 'monthly' THEN 
        (CURRENT_DATE + INTERVAL '1 month' + schedule_time)::TIMESTAMP WITH TIME ZONE
      ELSE 
        (CURRENT_DATE + INTERVAL '1 day' + schedule_time)::TIMESTAMP WITH TIME ZONE
    END
$function$;