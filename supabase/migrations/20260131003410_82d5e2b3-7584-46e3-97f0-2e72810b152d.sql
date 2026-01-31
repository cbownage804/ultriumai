-- Atlas Documentation System Tables

-- Organizations (client organizations for documentation)
CREATE TABLE public.atlas_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.atlas_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'General',
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Passwords (encrypted vault entries)
CREATE TABLE public.atlas_passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT,
  password_encrypted TEXT,
  url TEXT,
  notes TEXT,
  category TEXT DEFAULT 'General',
  otp_secret TEXT,
  last_rotated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SSL Certificates
CREATE TABLE public.atlas_ssl_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  issuer TEXT,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  certificate_type TEXT DEFAULT 'Standard',
  auto_renew BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configurations
CREATE TABLE public.atlas_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  configuration_type TEXT NOT NULL,
  configuration_data JSONB DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Runbooks / SOPs
CREATE TABLE public.atlas_runbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'General',
  estimated_time_minutes INTEGER,
  difficulty_level TEXT DEFAULT 'Medium',
  steps JSONB DEFAULT '[]',
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expirations tracking (unified view of expiring items)
CREATE TABLE public.atlas_expirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.atlas_organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_days INTEGER[] DEFAULT '{30, 14, 7, 1}',
  notes TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.atlas_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_ssl_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_expirations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for atlas_organizations
CREATE POLICY "Users can view their own organizations" ON public.atlas_organizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own organizations" ON public.atlas_organizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own organizations" ON public.atlas_organizations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own organizations" ON public.atlas_organizations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for atlas_documents
CREATE POLICY "Users can view their own documents" ON public.atlas_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.atlas_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.atlas_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.atlas_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for atlas_passwords
CREATE POLICY "Users can view their own passwords" ON public.atlas_passwords FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own passwords" ON public.atlas_passwords FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own passwords" ON public.atlas_passwords FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own passwords" ON public.atlas_passwords FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for atlas_ssl_certificates
CREATE POLICY "Users can view their own ssl certificates" ON public.atlas_ssl_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ssl certificates" ON public.atlas_ssl_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ssl certificates" ON public.atlas_ssl_certificates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ssl certificates" ON public.atlas_ssl_certificates FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for atlas_configurations
CREATE POLICY "Users can view their own configurations" ON public.atlas_configurations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own configurations" ON public.atlas_configurations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own configurations" ON public.atlas_configurations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own configurations" ON public.atlas_configurations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for atlas_runbooks
CREATE POLICY "Users can view their own runbooks" ON public.atlas_runbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own runbooks" ON public.atlas_runbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own runbooks" ON public.atlas_runbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own runbooks" ON public.atlas_runbooks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for atlas_expirations
CREATE POLICY "Users can view their own expirations" ON public.atlas_expirations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expirations" ON public.atlas_expirations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expirations" ON public.atlas_expirations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expirations" ON public.atlas_expirations FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_atlas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_atlas_organizations_updated_at BEFORE UPDATE ON public.atlas_organizations FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();
CREATE TRIGGER update_atlas_documents_updated_at BEFORE UPDATE ON public.atlas_documents FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();
CREATE TRIGGER update_atlas_passwords_updated_at BEFORE UPDATE ON public.atlas_passwords FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();
CREATE TRIGGER update_atlas_ssl_certificates_updated_at BEFORE UPDATE ON public.atlas_ssl_certificates FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();
CREATE TRIGGER update_atlas_configurations_updated_at BEFORE UPDATE ON public.atlas_configurations FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();
CREATE TRIGGER update_atlas_runbooks_updated_at BEFORE UPDATE ON public.atlas_runbooks FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();
CREATE TRIGGER update_atlas_expirations_updated_at BEFORE UPDATE ON public.atlas_expirations FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();

-- Indexes for performance
CREATE INDEX idx_atlas_documents_org ON public.atlas_documents(organization_id);
CREATE INDEX idx_atlas_passwords_org ON public.atlas_passwords(organization_id);
CREATE INDEX idx_atlas_ssl_certificates_org ON public.atlas_ssl_certificates(organization_id);
CREATE INDEX idx_atlas_configurations_org ON public.atlas_configurations(organization_id);
CREATE INDEX idx_atlas_runbooks_org ON public.atlas_runbooks(organization_id);
CREATE INDEX idx_atlas_expirations_org ON public.atlas_expirations(organization_id);
CREATE INDEX idx_atlas_expirations_expires ON public.atlas_expirations(expires_at);
CREATE INDEX idx_atlas_ssl_valid_until ON public.atlas_ssl_certificates(valid_until);