-- SafePass tables update for MSP support - Part 2: RLS policies and functions

-- RLS policies for SafePass usage logs
CREATE POLICY "Users can view their own usage logs" 
ON public.safepass_usage_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "MSPs can view their client usage logs" 
ON public.safepass_usage_logs 
FOR SELECT 
USING (
  msp_id IN (
    SELECT id FROM public.msps WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert usage logs" 
ON public.safepass_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- Update RLS policies for safepass_entries to support MSP access
CREATE POLICY "MSPs can view their client entries" 
ON public.safepass_entries 
FOR SELECT 
USING (
  msp_id IN (
    SELECT id FROM public.msps WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their own entries" 
ON public.safepass_entries 
FOR SELECT 
USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE id IN (
      SELECT client_id FROM public.client_users WHERE user_id = auth.uid()
    )
  )
);

-- Add function to track SafePass usage
CREATE OR REPLACE FUNCTION public.log_safepass_usage(
  p_user_id UUID,
  p_action_type TEXT,
  p_entry_id UUID DEFAULT NULL,
  p_vault_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_client_id UUID DEFAULT NULL,
  p_msp_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.safepass_usage_logs (
    user_id, action_type, entry_id, vault_id, metadata, client_id, msp_id
  ) VALUES (
    p_user_id, p_action_type, p_entry_id, p_vault_id, p_metadata, p_client_id, p_msp_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;