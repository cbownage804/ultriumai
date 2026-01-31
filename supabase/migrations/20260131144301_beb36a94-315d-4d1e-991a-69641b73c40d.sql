-- Drop dependent trigger, fix function, recreate trigger
DROP TRIGGER IF EXISTS cleanup_rate_limits_trigger ON contact_form_rate_limits;

DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();

CREATE FUNCTION public.cleanup_old_rate_limits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM contact_form_rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
  RETURN NULL;
END; $$;

-- Recreate the trigger
CREATE TRIGGER cleanup_rate_limits_trigger
AFTER INSERT ON contact_form_rate_limits
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_rate_limits();