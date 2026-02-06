
-- Table to store detected cross-client threat campaigns
CREATE TABLE public.xdr_cross_client_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  confidence INTEGER NOT NULL DEFAULT 50,
  affected_user_ids UUID[] NOT NULL DEFAULT '{}',
  affected_client_names TEXT[] NOT NULL DEFAULT '{}',
  shared_indicators JSONB NOT NULL DEFAULT '[]',
  mitre_tactics TEXT[] NOT NULL DEFAULT '{}',
  mitre_techniques TEXT[] NOT NULL DEFAULT '{}',
  triggering_threat_id UUID,
  related_threat_ids UUID[] NOT NULL DEFAULT '{}',
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xdr_cross_client_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin users can see all campaigns (cross-client requires admin visibility)
CREATE POLICY "Admin users can manage campaigns"
ON public.xdr_cross_client_campaigns
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Regular users can see campaigns that affect them
CREATE POLICY "Users can view campaigns affecting them"
ON public.xdr_cross_client_campaigns
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = ANY(affected_user_ids));

CREATE INDEX idx_xdr_campaigns_status ON public.xdr_cross_client_campaigns(status);
CREATE INDEX idx_xdr_campaigns_severity ON public.xdr_cross_client_campaigns(severity);
CREATE INDEX idx_xdr_campaigns_created ON public.xdr_cross_client_campaigns(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_xdr_campaigns_updated_at
BEFORE UPDATE ON public.xdr_cross_client_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
