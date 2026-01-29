-- Customer Portal Configuration Table
CREATE TABLE public.vanguard_portal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES msp_clients(id) ON DELETE CASCADE,
  portal_name TEXT NOT NULL DEFAULT 'Customer Portal',
  portal_logo_url TEXT,
  primary_color TEXT DEFAULT '#0891b2',
  enable_tickets BOOLEAN DEFAULT true,
  enable_health_status BOOLEAN DEFAULT true,
  enable_knowledge_base BOOLEAN DEFAULT true,
  enable_safepass BOOLEAN DEFAULT false,
  safepass_subscription_required BOOLEAN DEFAULT true,
  custom_css TEXT,
  welcome_message TEXT,
  support_email TEXT,
  support_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Portal Access Tokens for customer authentication
CREATE TABLE public.vanguard_portal_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_settings_id UUID NOT NULL REFERENCES vanguard_portal_settings(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  token_hash TEXT NOT NULL,
  device_id UUID REFERENCES vanguard_agents(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Customer Portal Tickets (from end-users)
CREATE TABLE public.vanguard_portal_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_settings_id UUID NOT NULL REFERENCES vanguard_portal_settings(id) ON DELETE CASCADE,
  portal_token_id UUID REFERENCES vanguard_portal_tokens(id),
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  device_id UUID REFERENCES vanguard_agents(id),
  attachments JSONB DEFAULT '[]',
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Portal ticket comments
CREATE TABLE public.vanguard_portal_ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES vanguard_portal_tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'technician'
  author_name TEXT,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vanguard_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_portal_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_portal_ticket_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portal_settings (MSP admins)
CREATE POLICY "Users can manage their portal settings"
  ON public.vanguard_portal_settings FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for portal_tokens (MSP admins)
CREATE POLICY "Users can manage portal tokens for their portals"
  ON public.vanguard_portal_tokens FOR ALL
  USING (
    portal_settings_id IN (
      SELECT id FROM public.vanguard_portal_settings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for portal_tickets (MSP admins can see all tickets for their portals)
CREATE POLICY "Users can manage tickets for their portals"
  ON public.vanguard_portal_tickets FOR ALL
  USING (
    portal_settings_id IN (
      SELECT id FROM public.vanguard_portal_settings WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ticket comments
CREATE POLICY "Users can manage comments for their tickets"
  ON public.vanguard_portal_ticket_comments FOR ALL
  USING (
    ticket_id IN (
      SELECT t.id FROM public.vanguard_portal_tickets t
      JOIN public.vanguard_portal_settings p ON t.portal_settings_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_vanguard_portal_settings_updated_at
  BEFORE UPDATE ON public.vanguard_portal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vanguard_portal_tickets_updated_at
  BEFORE UPDATE ON public.vanguard_portal_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_portal_tokens_email ON public.vanguard_portal_tokens(customer_email);
CREATE INDEX idx_portal_tickets_status ON public.vanguard_portal_tickets(status);
CREATE INDEX idx_portal_tickets_portal ON public.vanguard_portal_tickets(portal_settings_id);