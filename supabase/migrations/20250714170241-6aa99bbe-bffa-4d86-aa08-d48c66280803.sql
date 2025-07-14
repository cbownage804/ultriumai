-- Update SafePass tables to support MSP and client functionality

-- Add MSP and client tracking to safepass_entries
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS msp_org_id UUID;

-- Add MSP and client tracking to safepass_vaults
ALTER TABLE public.safepass_vaults 
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safepass_entries_client_id ON public.safepass_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_safepass_entries_msp_org_id ON public.safepass_entries(msp_org_id);
CREATE INDEX IF NOT EXISTS idx_safepass_vaults_client_id ON public.safepass_vaults(client_id);

-- Create table for SafePass usage tracking
CREATE TABLE IF NOT EXISTS public.safepass_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  msp_org_id UUID,
  action_type TEXT NOT NULL,
  entry_id UUID,
  vault_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on usage logs
ALTER TABLE public.safepass_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for SafePass usage logs
CREATE POLICY "Users can view their own usage logs" 
ON public.safepass_usage_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "MSPs can view their client usage logs" 
ON public.safepass_usage_logs 
FOR SELECT 
USING (
  msp_org_id IN (
    SELECT id FROM public.msp_organizations WHERE owner_id = auth.uid()
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
  msp_org_id IN (
    SELECT id FROM public.msp_organizations WHERE owner_id = auth.uid()
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

-- Update RLS policies for safepass_vaults to support MSP access
CREATE POLICY "MSPs can view their client vaults" 
ON public.safepass_vaults 
FOR SELECT 
USING (
  msp_org_id IN (
    SELECT id FROM public.msp_organizations WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their own vaults" 
ON public.safepass_vaults 
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
  p_msp_org_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.safepass_usage_logs (
    user_id, action_type, entry_id, vault_id, metadata, client_id, msp_org_id
  ) VALUES (
    p_user_id, p_action_type, p_entry_id, p_vault_id, p_metadata, p_client_id, p_msp_org_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;