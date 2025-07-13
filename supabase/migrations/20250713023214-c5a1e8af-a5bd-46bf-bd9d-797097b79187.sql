-- Fix remaining function search path warnings

-- Assign SLA to ticket function
CREATE OR REPLACE FUNCTION public.assign_sla_to_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Assign SLA policy based on priority
  NEW.sla_policy_id = (
    SELECT id FROM public.sla_policies 
    WHERE priority_level = NEW.priority 
    AND is_active = true 
    LIMIT 1
  );
  
  -- Calculate SLA due date
  IF NEW.sla_policy_id IS NOT NULL THEN
    NEW.sla_due_at = NEW.created_at + (
      SELECT (resolution_hours || ' hours')::INTERVAL 
      FROM public.sla_policies 
      WHERE id = NEW.sla_policy_id
    );
  END IF;
  
  -- Set last activity
  NEW.last_activity_at = now();
  
  RETURN NEW;
END;
$function$;

-- Log ticket activity function
CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  -- Log the activity
  INSERT INTO public.ticket_activities (ticket_id, user_id, activity_type, description, old_values, new_values)
  VALUES (
    NEW.id,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Ticket created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
      WHEN TG_OP = 'UPDATE' AND OLD.priority != NEW.priority THEN 'Priority changed from ' || OLD.priority || ' to ' || NEW.priority
      ELSE 'Ticket updated'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW)
  );
  
  -- Update last activity time
  NEW.last_activity_at = now();
  
  RETURN NEW;
END;
$function$;

-- Update Ultrium updated at function
CREATE OR REPLACE FUNCTION public.update_ultrium_updated_at_column()
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

-- Update threat intelligence function
CREATE OR REPLACE FUNCTION public.update_threat_intelligence_updated_at()
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

-- Update EDR behavioral analysis function
CREATE OR REPLACE FUNCTION public.update_edr_behavioral_analysis_updated_at()
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