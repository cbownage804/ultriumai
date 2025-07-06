-- Create network_assets table for device inventory
CREATE TABLE public.network_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID,
  ip_address TEXT NOT NULL,
  hostname TEXT,
  device_type TEXT,
  mac_address TEXT,
  manufacturer TEXT,
  os_info TEXT,
  open_ports INTEGER[],
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'online',
  vulnerabilities TEXT[],
  risk_level TEXT NOT NULL DEFAULT 'safe',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, user_id)
);

-- Create support_tickets table for ticketing system
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connector_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for network_assets
ALTER TABLE public.network_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for network_assets
CREATE POLICY "Users can manage their own network assets" 
ON public.network_assets 
FOR ALL 
USING (user_id = auth.uid());

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for support_tickets
CREATE POLICY "Users can manage their own support tickets" 
ON public.support_tickets 
FOR ALL 
USING (user_id = auth.uid());

-- Create function for automatic timestamp updates
CREATE TRIGGER update_network_assets_updated_at
BEFORE UPDATE ON public.network_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();