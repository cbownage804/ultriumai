
-- Fix: Set search_path on custom function to prevent search path injection
CREATE OR REPLACE FUNCTION public.update_email_routing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
