-- Create announcements table for client portals
CREATE TABLE public.client_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  client_id uuid NULL,
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  is_active boolean NOT NULL DEFAULT true,
  scheduled_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NULL,
  auto_generated boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for MSPs to manage announcements
CREATE POLICY "MSPs can manage their announcements" 
ON public.client_announcements 
FOR ALL 
USING (user_id = auth.uid());

-- Create policy for clients to view active announcements
CREATE POLICY "Clients can view active announcements" 
ON public.client_announcements 
FOR SELECT 
USING (
  is_active = true 
  AND scheduled_at <= now() 
  AND (expires_at IS NULL OR expires_at > now())
  AND (client_id IS NULL OR client_id IN (
    SELECT msp_clients.id 
    FROM msp_clients 
    JOIN client_users ON client_users.client_id = msp_clients.id 
    WHERE client_users.user_id = auth.uid()
  ))
);

-- Create trigger for updated_at
CREATE TRIGGER update_client_announcements_updated_at
BEFORE UPDATE ON public.client_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();