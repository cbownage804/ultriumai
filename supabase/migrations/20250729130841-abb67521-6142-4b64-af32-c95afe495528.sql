-- Fix function search paths for security
-- Update all functions to have secure search_path setting

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile entry for new user
  INSERT INTO public.profiles (id, user_id, email, full_name, account_type, company_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'business'::public.account_type),
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    account_type = COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, public.profiles.account_type),
    company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', public.profiles.company_name),
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

-- Fix setup_user_subscription_defaults function
CREATE OR REPLACE FUNCTION public.setup_user_subscription_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create default notification preferences
  INSERT INTO public.subscription_notifications (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default credit allocation
  INSERT INTO public.user_credits (user_id, credits_used, credits_limit)
  VALUES (NEW.id, 0, 500)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Fix handle_new_team function
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.team_memberships (team_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
  RETURN NEW;
END;
$function$;

-- Fix log_asset_changes function
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.asset_history (asset_id, action, old_values, new_values, changed_by)
    VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.asset_history (asset_id, action, new_values, changed_by)
    VALUES (NEW.id, 'created', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix is_current_user_admin function  
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  );
END;
$function$;

-- Fix handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Fix update_credit_limits_on_subscription_change function
CREATE OR REPLACE FUNCTION public.update_credit_limits_on_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update credit limit based on subscription tier with more granular control
  UPDATE public.user_credits 
  SET 
    credits_limit = CASE 
      WHEN NEW.subscription_tier = 'enterprise' AND NEW.subscribed = true THEN 15000
      WHEN NEW.subscription_tier = 'premium' AND NEW.subscribed = true THEN 5000
      ELSE 500
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Create credits record if it doesn't exist
  INSERT INTO public.user_credits (user_id, credits_used, credits_limit)
  SELECT NEW.user_id, 0, 
    CASE 
      WHEN NEW.subscription_tier = 'enterprise' AND NEW.subscribed = true THEN 15000
      WHEN NEW.subscription_tier = 'premium' AND NEW.subscribed = true THEN 5000
      ELSE 500
    END
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_credits WHERE user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$function$;

-- Fix create_incident_from_event function
CREATE OR REPLACE FUNCTION public.create_incident_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create incident for high/critical severity events
  IF NEW.severity IN ('high', 'critical') THEN
    INSERT INTO public.incidents (
      user_id,
      title,
      description,
      priority,
      severity,
      source_event_id,
      category,
      affected_systems,
      sla_deadline,
      response_sla_minutes,
      resolution_sla_minutes
    ) VALUES (
      NEW.user_id,
      'Security Incident: ' || NEW.title,
      NEW.description,
      CASE 
        WHEN NEW.severity = 'critical' THEN 'critical'
        WHEN NEW.severity = 'high' THEN 'high'
        ELSE 'medium'
      END,
      NEW.severity,
      NEW.id,
      'Security Incident',
      NEW.affected_assets,
      now() + INTERVAL '4 hours', -- Default 4 hour response SLA
      CASE 
        WHEN NEW.severity = 'critical' THEN 60  -- 1 hour for critical
        WHEN NEW.severity = 'high' THEN 240     -- 4 hours for high
        ELSE 480                                -- 8 hours for medium
      END,
      CASE 
        WHEN NEW.severity = 'critical' THEN 240  -- 4 hours for critical
        WHEN NEW.severity = 'high' THEN 1440     -- 24 hours for high
        ELSE 2880                                -- 48 hours for medium
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;