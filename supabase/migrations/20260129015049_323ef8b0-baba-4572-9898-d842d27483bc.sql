-- Create lead_captures table for demo requests and newsletter signups
CREATE TABLE public.lead_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  company_size TEXT,
  product_interest TEXT,
  message TEXT,
  lead_source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public forms)
CREATE POLICY "Anyone can submit lead capture forms"
ON public.lead_captures
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins can read leads (you can adjust this based on your admin roles)
CREATE POLICY "Authenticated users can view leads"
ON public.lead_captures
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_lead_captures_email ON public.lead_captures(email);
CREATE INDEX idx_lead_captures_status ON public.lead_captures(status);
CREATE INDEX idx_lead_captures_created_at ON public.lead_captures(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_lead_captures_updated_at
BEFORE UPDATE ON public.lead_captures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();