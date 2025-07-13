-- Fix final remaining functions

-- Handle new user role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Update daily analytics function
CREATE OR REPLACE FUNCTION public.update_daily_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.daily_analytics (
    date, 
    gpt_id, 
    user_id, 
    total_conversations, 
    total_messages, 
    total_tokens,
    unique_users,
    average_response_time_ms,
    average_satisfaction,
    updated_at
  )
  VALUES (
    CURRENT_DATE,
    NEW.gpt_id,
    NEW.user_id,
    1,
    CASE WHEN NEW.interaction_type = 'message' THEN 1 ELSE 0 END,
    COALESCE(NEW.tokens_used, 0),
    1,
    COALESCE(NEW.response_time_ms, 0),
    NEW.satisfaction_rating,
    now()
  )
  ON CONFLICT (date, gpt_id, user_id) 
  DO UPDATE SET
    total_messages = daily_analytics.total_messages + CASE WHEN NEW.interaction_type = 'message' THEN 1 ELSE 0 END,
    total_tokens = daily_analytics.total_tokens + COALESCE(NEW.tokens_used, 0),
    average_response_time_ms = (daily_analytics.average_response_time_ms + COALESCE(NEW.response_time_ms, 0)) / 2,
    average_satisfaction = CASE 
      WHEN NEW.satisfaction_rating IS NOT NULL THEN 
        (COALESCE(daily_analytics.average_satisfaction, 0) + NEW.satisfaction_rating) / 2
      ELSE daily_analytics.average_satisfaction
    END,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- Handle new team function
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.team_memberships (team_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
  RETURN NEW;
END;
$function$;