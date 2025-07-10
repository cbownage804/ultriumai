-- Create MSP billing usage tracking table
CREATE TABLE public.msp_billing_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'safescan_api', 'safescan_manual', 'rmm', etc.
  usage_type TEXT NOT NULL, -- 'scan', 'storage', 'api_call', etc.
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,4) NOT NULL DEFAULT 0.0,
  total_cost DECIMAL(10,4) NOT NULL DEFAULT 0.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  billing_period DATE DEFAULT CURRENT_DATE,
  processed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.msp_billing_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for MSP billing usage
CREATE POLICY "MSPs can view their own billing usage" 
ON public.msp_billing_usage 
FOR SELECT 
USING (msp_id = (
  SELECT m.id::text FROM msps m WHERE m.user_id = auth.uid()
));

CREATE POLICY "System can insert billing usage" 
ON public.msp_billing_usage 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "MSPs can update their own billing usage" 
ON public.msp_billing_usage 
FOR UPDATE 
USING (msp_id = (
  SELECT m.id::text FROM msps m WHERE m.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_msp_billing_usage_msp_id ON public.msp_billing_usage(msp_id);
CREATE INDEX idx_msp_billing_usage_billing_period ON public.msp_billing_usage(billing_period);
CREATE INDEX idx_msp_billing_usage_created_at ON public.msp_billing_usage(created_at);

-- Create billing summary view
CREATE OR REPLACE VIEW public.msp_billing_summary AS
SELECT 
  msp_id,
  billing_period,
  service_type,
  SUM(quantity) as total_quantity,
  SUM(total_cost) as total_cost,
  COUNT(*) as transaction_count,
  MIN(created_at) as period_start,
  MAX(created_at) as period_end
FROM public.msp_billing_usage
GROUP BY msp_id, billing_period, service_type;

-- Add API key validation function
CREATE OR REPLACE FUNCTION public.validate_api_key(key_hash TEXT)
RETURNS TABLE(user_id UUID, is_valid BOOLEAN, rate_limit_rpd INTEGER)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    ak.user_id,
    (ak.is_active AND (ak.expires_at IS NULL OR ak.expires_at > now())) as is_valid,
    ak.rate_limit_rpd
  FROM public.api_keys ak
  WHERE ak.key_hash = validate_api_key.key_hash;
$$;