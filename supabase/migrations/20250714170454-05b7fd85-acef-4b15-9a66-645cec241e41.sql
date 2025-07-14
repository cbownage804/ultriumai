-- SafePass tables update for MSP support - Part 1: Add columns and indexes

-- Add MSP and client tracking to safepass_entries
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS msp_id UUID;

-- Add MSP and client tracking to safepass_vaults
ALTER TABLE public.safepass_vaults 
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safepass_entries_client_id ON public.safepass_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_safepass_entries_msp_id ON public.safepass_entries(msp_id);
CREATE INDEX IF NOT EXISTS idx_safepass_vaults_client_id ON public.safepass_vaults(client_id);

-- Create table for SafePass usage tracking
CREATE TABLE IF NOT EXISTS public.safepass_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  msp_id UUID,
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