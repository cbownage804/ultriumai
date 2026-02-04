-- Drop overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage all alerts" ON public.device_availability_alerts;