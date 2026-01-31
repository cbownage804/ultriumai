-- Email Routing Rules for Multi-Tenant Email-to-Ticket
-- Allows MSPs to configure how emails are routed based on sender domain, contact email, or device

-- Email domain-to-client mapping (like Atera's "select customers" feature)
CREATE TABLE IF NOT EXISTS public.email_domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_config_id UUID REFERENCES public.vanguard_email_configs(id) ON DELETE CASCADE,
  domain TEXT NOT NULL, -- e.g., "acmecorp.com"
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority = checked first
  match_type TEXT DEFAULT 'exact' CHECK (match_type IN ('exact', 'wildcard', 'regex')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Contact email direct mappings (for known contacts)
CREATE TABLE IF NOT EXISTS public.email_contact_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_config_id UUID REFERENCES public.vanguard_email_configs(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL, -- Exact email like "john@acme.com"
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  auto_created BOOLEAN DEFAULT false, -- True if system learned this mapping
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email_address)
);

-- Device-to-email routing (for RMM integration)
-- When an alert comes from a device, we can match the device's client
CREATE TABLE IF NOT EXISTS public.email_device_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_config_id UUID REFERENCES public.vanguard_email_configs(id) ON DELETE CASCADE,
  device_identifier TEXT NOT NULL, -- Hostname, IP, or device_id
  identifier_type TEXT DEFAULT 'hostname' CHECK (identifier_type IN ('hostname', 'ip_address', 'device_id', 'mac_address')),
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_identifier, identifier_type)
);

-- Email routing configuration per mailbox
-- Extends vanguard_email_configs with routing settings
CREATE TABLE IF NOT EXISTS public.email_routing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_config_id UUID REFERENCES public.vanguard_email_configs(id) ON DELETE CASCADE UNIQUE,
  -- Matching preferences
  enable_contact_matching BOOLEAN DEFAULT true,
  enable_domain_matching BOOLEAN DEFAULT true,
  enable_device_matching BOOLEAN DEFAULT true,
  enable_auto_learning BOOLEAN DEFAULT true, -- Auto-create contact mappings when tickets are created
  -- Unknown sender handling
  unknown_sender_action TEXT DEFAULT 'create_unassigned' CHECK (unknown_sender_action IN ('create_unassigned', 'hold_for_review', 'reject', 'assign_default')),
  default_client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
  -- Thread tracking
  enable_thread_tracking BOOLEAN DEFAULT true,
  thread_subject_patterns TEXT[] DEFAULT ARRAY['RE:', 'FW:', 'Fwd:'],
  -- RMM integration
  parse_device_info BOOLEAN DEFAULT false, -- Try to extract device info from email body
  device_info_patterns TEXT[] DEFAULT ARRAY['Device:', 'Hostname:', 'Computer:'],
  -- Notifications
  notify_on_unknown_sender BOOLEAN DEFAULT false,
  notify_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add matched client/contact columns to inbound emails
ALTER TABLE public.vanguard_inbound_emails 
ADD COLUMN IF NOT EXISTS matched_client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS matched_contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS matched_device_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS match_method TEXT, -- 'contact_email', 'domain', 'device', 'thread', 'manual'
ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(3,2) DEFAULT 1.00, -- 0.00 to 1.00
ADD COLUMN IF NOT EXISTS thread_id TEXT, -- For email threading
ADD COLUMN IF NOT EXISTS in_reply_to TEXT, -- Email threading
ADD COLUMN IF NOT EXISTS message_id TEXT, -- Unique email message ID
ADD COLUMN IF NOT EXISTS sender_name TEXT, -- Display name of sender
ADD COLUMN IF NOT EXISTS cc_addresses TEXT[], -- CC recipients
ADD COLUMN IF NOT EXISTS extracted_device_info JSONB; -- Parsed device info from body

-- Enable RLS on new tables
ALTER TABLE public.email_domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_device_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_routing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own domain mappings" ON public.email_domain_mappings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own contact mappings" ON public.email_contact_mappings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own device mappings" ON public.email_device_mappings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own routing settings" ON public.email_routing_settings
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for fast lookups during email processing
CREATE INDEX IF NOT EXISTS idx_email_domain_mappings_domain ON public.email_domain_mappings(user_id, domain, is_active);
CREATE INDEX IF NOT EXISTS idx_email_contact_mappings_email ON public.email_contact_mappings(user_id, email_address, is_active);
CREATE INDEX IF NOT EXISTS idx_email_device_mappings_device ON public.email_device_mappings(user_id, device_identifier, identifier_type, is_active);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_thread ON public.vanguard_inbound_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_message_id ON public.vanguard_inbound_emails(message_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_email_routing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_email_domain_mappings_updated_at
  BEFORE UPDATE ON public.email_domain_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_email_routing_updated_at();

CREATE TRIGGER update_email_contact_mappings_updated_at
  BEFORE UPDATE ON public.email_contact_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_email_routing_updated_at();

CREATE TRIGGER update_email_device_mappings_updated_at
  BEFORE UPDATE ON public.email_device_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_email_routing_updated_at();

CREATE TRIGGER update_email_routing_settings_updated_at
  BEFORE UPDATE ON public.email_routing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_email_routing_updated_at();