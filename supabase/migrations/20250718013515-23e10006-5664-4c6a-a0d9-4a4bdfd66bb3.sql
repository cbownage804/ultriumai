-- Grant service role permission to bypass RLS for network_scans
ALTER TABLE public.network_scans FORCE ROW LEVEL SECURITY;

-- Update RLS policy to allow service role inserts
DROP POLICY IF EXISTS "Service role can insert network scans" ON public.network_scans;
CREATE POLICY "Service role can insert network scans" 
ON public.network_scans 
FOR INSERT 
TO service_role
WITH CHECK (true);