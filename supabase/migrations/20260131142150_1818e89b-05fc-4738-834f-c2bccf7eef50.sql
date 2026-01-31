-- Create leads table to capture incoming signups/contact form submissions
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Basic info
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  -- Business details
  business_type TEXT,
  service_provider_type TEXT,
  business_size TEXT,
  industry TEXT,
  -- Interest details
  project_type TEXT,
  product_type TEXT,
  white_labeled TEXT,
  message TEXT,
  product_interests TEXT[],
  -- Lead management
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source TEXT DEFAULT 'website',
  notes TEXT,
  assigned_to UUID,
  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  converted_to_client_id UUID,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins can see all leads (for support purposes)
CREATE POLICY "Admins can manage all leads"
ON public.leads
FOR ALL
USING (public.is_admin_user());

-- Users can view their own lead record
CREATE POLICY "Users can view their own lead"
ON public.leads
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Create function to auto-create lead when user signs up
CREATE OR REPLACE FUNCTION public.create_lead_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leads (user_id, email, first_name, source, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'signup',
    'new'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auto-lead creation on signup
CREATE TRIGGER on_auth_user_created_lead
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_lead_on_signup();

-- Update leads updated_at on change
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_leads_timestamp
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_leads_updated_at();