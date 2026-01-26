-- Create rate limiting table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_form_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_contact_form_rate_limits_ip_time 
ON public.contact_form_rate_limits(ip_address, submitted_at DESC);

-- Enable RLS (but allow edge function service role to bypass)
ALTER TABLE public.contact_form_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can read/write
-- (Edge functions use service role key)

-- Auto-cleanup old records (keep last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.contact_form_rate_limits 
  WHERE submitted_at < now() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger cleanup on new inserts (lightweight cleanup)
CREATE TRIGGER cleanup_rate_limits_trigger
AFTER INSERT ON public.contact_form_rate_limits
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_rate_limits();