-- Create table for MSP client white-label configurations
CREATE TABLE public.msp_client_whitelabel_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  company_logo TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#3b82f6',
  secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#000000',
  custom_domain TEXT NOT NULL DEFAULT '',
  favicon_url TEXT NOT NULL DEFAULT '',
  custom_css TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT 'Powered by UltriumGPT',
  hide_powered_by BOOLEAN NOT NULL DEFAULT false,
  custom_login_page BOOLEAN NOT NULL DEFAULT false,
  email_templates JSONB NOT NULL DEFAULT '{
    "welcome": "Welcome to {{company_name}}! Your account has been created successfully.",
    "password_reset": "Click the link below to reset your password for {{company_name}}.",
    "invitation": "You''ve been invited to join {{company_name}}. Click here to get started."
  }'::jsonb,
  co_management_enabled BOOLEAN NOT NULL DEFAULT true,
  client_can_edit BOOLEAN NOT NULL DEFAULT false,
  msp_approval_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(msp_user_id, client_id)
);

-- Enable RLS
ALTER TABLE public.msp_client_whitelabel_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for MSP client white-label configs
CREATE POLICY "MSPs can manage their client white-label configs"
ON public.msp_client_whitelabel_configs
FOR ALL
USING (msp_user_id = auth.uid());

-- Create policy for clients to view their config (if co-management is enabled)
CREATE POLICY "Clients can view their white-label config"
ON public.msp_client_whitelabel_configs
FOR SELECT
USING (
  co_management_enabled = true AND
  client_id IN (
    SELECT msp_clients.id 
    FROM msp_clients 
    WHERE msp_clients.contact_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Create policy for clients to update their config (if allowed)
CREATE POLICY "Clients can update their white-label config"
ON public.msp_client_whitelabel_configs
FOR UPDATE
USING (
  co_management_enabled = true AND
  client_can_edit = true AND
  client_id IN (
    SELECT msp_clients.id 
    FROM msp_clients 
    WHERE msp_clients.contact_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Create trigger to update timestamp
CREATE TRIGGER update_msp_client_whitelabel_configs_updated_at
BEFORE UPDATE ON public.msp_client_whitelabel_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for white-label change approvals
CREATE TABLE public.whitelabel_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.msp_client_whitelabel_configs(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'client_update', 'msp_update'
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whitelabel_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for change requests
CREATE POLICY "Users can view change requests they created or need to review"
ON public.whitelabel_change_requests
FOR SELECT
USING (
  requested_by = auth.uid() OR
  config_id IN (
    SELECT id FROM public.msp_client_whitelabel_configs 
    WHERE msp_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create change requests"
ON public.whitelabel_change_requests
FOR INSERT
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "MSPs can update change requests for their clients"
ON public.whitelabel_change_requests  
FOR UPDATE
USING (
  config_id IN (
    SELECT id FROM public.msp_client_whitelabel_configs 
    WHERE msp_user_id = auth.uid()
  )
);

-- Create trigger to update timestamp
CREATE TRIGGER update_whitelabel_change_requests_updated_at
BEFORE UPDATE ON public.whitelabel_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();