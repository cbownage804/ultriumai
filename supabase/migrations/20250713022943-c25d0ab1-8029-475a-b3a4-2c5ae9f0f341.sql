-- Continue fixing remaining functions (part 3)

-- Get user account type function
CREATE OR REPLACE FUNCTION public.get_user_account_type(_user_id uuid)
RETURNS account_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT account_type FROM public.profiles WHERE id = _user_id;
$function$;

-- Is MSP or MSSP function
CREATE OR REPLACE FUNCTION public.is_msp_or_mssp(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND account_type IN ('msp', 'mssp')
  );
$function$;

-- Update notification preferences function
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
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

-- Update user presence function
CREATE OR REPLACE FUNCTION public.update_user_presence_updated_at()
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

-- Send notification function
CREATE OR REPLACE FUNCTION public.send_notification(p_user_id uuid, p_title text, p_message text, p_type text DEFAULT 'info'::text, p_category text DEFAULT 'general'::text, p_action_url text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, category, action_url, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_category, p_action_url, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

-- Update MSP email settings function
CREATE OR REPLACE FUNCTION public.update_msp_email_settings_updated_at()
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

-- Update MSP license counts function
CREATE OR REPLACE FUNCTION public.update_msp_license_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update assigned_licenses count for the affected MSP and tier
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.msp_license_pools 
    SET assigned_licenses = (
      SELECT COALESCE(SUM(assigned_users), 0) 
      FROM public.msp_client_license_assignments mcla
      JOIN public.msp_clients mc ON mc.id = mcla.client_id
      WHERE mc.msp_id = msp_license_pools.msp_id 
      AND mcla.tier = msp_license_pools.tier
    )
    WHERE msp_id = (
      SELECT mc.msp_id FROM public.msp_clients mc 
      WHERE mc.id = NEW.client_id
    ) AND tier = NEW.tier;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.msp_license_pools 
    SET assigned_licenses = (
      SELECT COALESCE(SUM(assigned_users), 0) 
      FROM public.msp_client_license_assignments mcla
      JOIN public.msp_clients mc ON mc.id = mcla.client_id
      WHERE mc.msp_id = msp_license_pools.msp_id 
      AND mcla.tier = msp_license_pools.tier
    )
    WHERE msp_id = (
      SELECT mc.msp_id FROM public.msp_clients mc 
      WHERE mc.id = OLD.client_id
    ) AND tier = OLD.tier;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;