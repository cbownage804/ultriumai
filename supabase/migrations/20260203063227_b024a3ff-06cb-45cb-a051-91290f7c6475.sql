-- XDR Attack Chains table for SIEM correlation
CREATE TABLE IF NOT EXISTS public.xdr_attack_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chain_id UUID NOT NULL,
  chain_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  mitre_tactics TEXT[] DEFAULT '{}',
  events JSONB DEFAULT '[]',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  chain_status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.xdr_attack_chains ENABLE ROW LEVEL SECURITY;

-- RLS policies for xdr_attack_chains
CREATE POLICY "Users can view their own attack chains"
  ON public.xdr_attack_chains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attack chains"
  ON public.xdr_attack_chains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attack chains"
  ON public.xdr_attack_chains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to attack chains"
  ON public.xdr_attack_chains FOR ALL
  USING (public.is_service_role());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xdr_attack_chains_user_id ON public.xdr_attack_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_xdr_attack_chains_chain_status ON public.xdr_attack_chains(chain_status);
CREATE INDEX IF NOT EXISTS idx_xdr_attack_chains_start_time ON public.xdr_attack_chains(start_time);

-- Add correlation_id to security_events for attack chain linking
ALTER TABLE public.security_events 
  ADD COLUMN IF NOT EXISTS correlation_id UUID;