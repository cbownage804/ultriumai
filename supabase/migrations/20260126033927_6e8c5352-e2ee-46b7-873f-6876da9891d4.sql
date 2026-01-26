-- Create software licenses table for SafeTrack Business users
CREATE TABLE public.software_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor TEXT,
  version TEXT,
  license_type TEXT DEFAULT 'perpetual' CHECK (license_type IN ('perpetual', 'subscription', 'volume', 'trial', 'freeware', 'open_source')),
  license_key TEXT,
  seats_total INTEGER DEFAULT 1,
  seats_used INTEGER DEFAULT 0,
  cost_per_seat NUMERIC(10,2),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'one_time', 'other')),
  purchase_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  category TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own software licenses"
ON public.software_licenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own software licenses"
ON public.software_licenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own software licenses"
ON public.software_licenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own software licenses"
ON public.software_licenses FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_software_licenses_updated_at
BEFORE UPDATE ON public.software_licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();