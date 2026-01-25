-- SafeTrack Enterprise Asset Management Schema Enhancements
-- Adds office locations for multi-site tracking, condition tracking, and warranty linkage

BEGIN;

-- Office Locations table for multi-site customers
CREATE TABLE IF NOT EXISTS public.office_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  postal_code TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on office_locations
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY office_locations_owner_select
ON public.office_locations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY office_locations_owner_insert
ON public.office_locations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY office_locations_owner_update
ON public.office_locations FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY office_locations_owner_delete
ON public.office_locations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Add condition and office_location_id to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'good' 
CHECK (condition IN ('new', 'excellent', 'good', 'fair', 'poor', 'damaged'));

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS office_location_id UUID REFERENCES public.office_locations(id) ON DELETE SET NULL;

-- Add warranty_id to link assets to warranty lookup results
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS warranty_id UUID REFERENCES public.safetrack_warranties(id) ON DELETE SET NULL;

-- Add last_warranty_check column
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS last_warranty_check TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assets_office_location ON public.assets(office_location_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON public.assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_office_locations_user ON public.office_locations(user_id);

-- Update trigger for office_locations
CREATE OR REPLACE FUNCTION update_office_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_office_locations_timestamp ON public.office_locations;
CREATE TRIGGER update_office_locations_timestamp
BEFORE UPDATE ON public.office_locations
FOR EACH ROW EXECUTE FUNCTION update_office_locations_updated_at();

COMMIT;