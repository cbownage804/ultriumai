-- Create warranty tracking table for SafeTrack
CREATE TABLE public.safetrack_warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  serial_number TEXT NOT NULL,
  device_name TEXT,
  manufacturer TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_status TEXT DEFAULT 'unknown', -- active, expired, unknown
  coverage_type TEXT, -- standard, extended, accidental, etc.
  repair_options JSONB DEFAULT '[]'::jsonb,
  support_contacts JSONB DEFAULT '{}'::jsonb,
  raw_warranty_data JSONB DEFAULT '{}'::jsonb,
  ai_analysis TEXT,
  source_url TEXT,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_serial UNIQUE (user_id, serial_number)
);

-- Enable RLS
ALTER TABLE public.safetrack_warranties ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own warranties
CREATE POLICY "Users can view their own warranties"
  ON public.safetrack_warranties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warranties"
  ON public.safetrack_warranties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warranties"
  ON public.safetrack_warranties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warranties"
  ON public.safetrack_warranties FOR DELETE
  USING (auth.uid() = user_id);

-- Block anonymous access
CREATE POLICY "Block anonymous warranty access"
  ON public.safetrack_warranties AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_safetrack_warranties_updated_at
  BEFORE UPDATE ON public.safetrack_warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_safetrack_warranties_user_id ON public.safetrack_warranties(user_id);
CREATE INDEX idx_safetrack_warranties_status ON public.safetrack_warranties(warranty_status);
CREATE INDEX idx_safetrack_warranties_end_date ON public.safetrack_warranties(warranty_end_date);