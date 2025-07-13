-- Create MSP License Pool System
-- This tracks how many licenses of each tier an MSP has purchased from Ultrium

CREATE TABLE public.msp_license_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL REFERENCES public.msps(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')),
  total_licenses INTEGER NOT NULL DEFAULT 0,
  assigned_licenses INTEGER NOT NULL DEFAULT 0,
  available_licenses INTEGER GENERATED ALWAYS AS (total_licenses - assigned_licenses) STORED,
  price_per_license DECIMAL(10,2) NOT NULL, -- What MSP pays Ultrium per license
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(msp_id, tier)
);

-- Create Client License Assignments
-- This tracks which tier each client is assigned and how many users
CREATE TABLE public.msp_client_license_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')),
  assigned_users INTEGER NOT NULL DEFAULT 0,
  price_per_user DECIMAL(10,2) NOT NULL, -- What MSP charges client per user
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id) -- One tier assignment per client
);

-- Create User License Assignments (for per-user tier assignment within clients)
CREATE TABLE public.msp_user_license_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_email)
);

-- Enable RLS
ALTER TABLE public.msp_license_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_client_license_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_user_license_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MSP License Pools
CREATE POLICY "MSPs can manage their own license pools"
ON public.msp_license_pools
FOR ALL
USING (msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid()));

-- RLS Policies for Client License Assignments
CREATE POLICY "MSPs can manage their client license assignments"
ON public.msp_client_license_assignments
FOR ALL
USING (client_id IN (
  SELECT id FROM public.msp_clients 
  WHERE msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
));

-- RLS Policies for User License Assignments
CREATE POLICY "MSPs can manage their user license assignments"
ON public.msp_user_license_assignments
FOR ALL
USING (client_id IN (
  SELECT id FROM public.msp_clients 
  WHERE msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
));

-- Create function to update license counts when assignments change
CREATE OR REPLACE FUNCTION update_msp_license_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update assigned_licenses count for the affected MSP and tier
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.msp_license_pools 
    SET assigned_licenses = (
      SELECT COALESCE(SUM(assigned_users), 0) 
      FROM public.msp_client_license_assignments mcla
      JOIN public.msp_clients mc ON mc.id = mcla.client_id
      WHERE mc.msp_id = msp_license_pools.msp_id 
      AND mcla.tier = msp_license_pools.tier
    )
    WHERE msp_id = (
      SELECT mc.msp_id FROM public.msp_clients mc 
      WHERE mc.id = NEW.client_id
    ) AND tier = NEW.tier;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.msp_license_pools 
    SET assigned_licenses = (
      SELECT COALESCE(SUM(assigned_users), 0) 
      FROM public.msp_client_license_assignments mcla
      JOIN public.msp_clients mc ON mc.id = mcla.client_id
      WHERE mc.msp_id = msp_license_pools.msp_id 
      AND mcla.tier = msp_license_pools.tier
    )
    WHERE msp_id = (
      SELECT mc.msp_id FROM public.msp_clients mc 
      WHERE mc.id = OLD.client_id
    ) AND tier = OLD.tier;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update license counts
CREATE TRIGGER update_license_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.msp_client_license_assignments
  FOR EACH ROW EXECUTE FUNCTION update_msp_license_counts();

-- Create function to update user license counts
CREATE OR REPLACE FUNCTION update_user_license_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update assigned_users count in client assignments based on active user assignments
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    UPDATE public.msp_client_license_assignments
    SET assigned_users = (
      SELECT COUNT(*) 
      FROM public.msp_user_license_assignments 
      WHERE client_id = msp_client_license_assignments.client_id 
      AND is_active = true
    )
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user license assignments
CREATE TRIGGER update_user_license_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.msp_user_license_assignments
  FOR EACH ROW EXECUTE FUNCTION update_user_license_counts();

-- Insert default license pools for existing MSPs (if any)
-- This gives them some starter licenses to test with
INSERT INTO public.msp_license_pools (msp_id, tier, total_licenses, price_per_license)
SELECT 
  id as msp_id,
  tier,
  CASE tier
    WHEN 'basic' THEN 50
    WHEN 'premium' THEN 25
    WHEN 'enterprise' THEN 10
  END as total_licenses,
  CASE tier
    WHEN 'basic' THEN 8.00
    WHEN 'premium' THEN 12.00
    WHEN 'enterprise' THEN 18.00
  END as price_per_license
FROM public.msps
CROSS JOIN (VALUES ('basic'), ('premium'), ('enterprise')) AS t(tier)
WHERE EXISTS (SELECT 1 FROM public.msps)
ON CONFLICT (msp_id, tier) DO NOTHING;