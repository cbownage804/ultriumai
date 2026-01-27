-- Add deny policy for anonymous access to msp_api_keys
CREATE POLICY "deny_anon_msp_api_keys" 
ON public.msp_api_keys 
FOR ALL 
TO anon 
USING (false);