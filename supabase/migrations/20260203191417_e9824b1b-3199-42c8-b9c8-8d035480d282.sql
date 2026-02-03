-- =============================================
-- PORTAL ACTIVITY LOGGING & PASSWORD RESET
-- =============================================

-- Portal activity logs table
CREATE TABLE IF NOT EXISTS public.portal_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  portal_user_id UUID REFERENCES public.client_portal_users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  client_id UUID,
  activity_type TEXT NOT NULL,
  activity_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portal_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for portal_activity_logs
CREATE POLICY "MSPs can view their portal activity logs"
ON public.portal_activity_logs
FOR SELECT
USING (msp_user_id = auth.uid());

CREATE POLICY "System can insert portal activity logs"
ON public.portal_activity_logs
FOR INSERT
WITH CHECK (true);

-- Portal password reset tokens table
CREATE TABLE IF NOT EXISTS public.portal_password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_user_id UUID NOT NULL REFERENCES public.client_portal_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portal_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policy - allow system to manage tokens
CREATE POLICY "Allow token management"
ON public.portal_password_reset_tokens
FOR ALL
USING (true);

-- Portal invitation tracking table
CREATE TABLE IF NOT EXISTS public.portal_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.client_contacts(id) ON DELETE CASCADE,
  portal_user_id UUID REFERENCES public.client_portal_users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  msp_user_id UUID NOT NULL,
  invitation_token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  welcome_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portal_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for portal_invitations
CREATE POLICY "MSPs can view their portal invitations"
ON public.portal_invitations
FOR SELECT
USING (msp_user_id = auth.uid());

CREATE POLICY "MSPs can insert their portal invitations"
ON public.portal_invitations
FOR INSERT
WITH CHECK (msp_user_id = auth.uid());

CREATE POLICY "MSPs can update their portal invitations"
ON public.portal_invitations
FOR UPDATE
USING (msp_user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_msp_user_id ON public.portal_activity_logs(msp_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_portal_user_id ON public.portal_activity_logs(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_created_at ON public.portal_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_activity_type ON public.portal_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_portal_password_reset_tokens_token_hash ON public.portal_password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_invitations_token ON public.portal_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_portal_invitations_contact_id ON public.portal_invitations(contact_id);

-- Add fields to portal users for login tracking
ALTER TABLE public.client_portal_users 
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- Function to log portal activity
CREATE OR REPLACE FUNCTION public.log_portal_activity(
  p_portal_user_id UUID,
  p_activity_type TEXT,
  p_activity_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_contact_id UUID;
  v_client_id UUID;
  v_msp_user_id UUID;
BEGIN
  -- Get contact and client info from portal user
  SELECT pu.contact_id, pu.client_id, r.user_id
  INTO v_contact_id, v_client_id, v_msp_user_id
  FROM client_portal_users pu
  LEFT JOIN rmm_customers r ON r.id = pu.client_id
  WHERE pu.id = p_portal_user_id;

  INSERT INTO portal_activity_logs (
    msp_user_id, portal_user_id, contact_id, client_id, 
    activity_type, activity_details, ip_address, user_agent
  )
  VALUES (
    v_msp_user_id, p_portal_user_id, v_contact_id, v_client_id,
    p_activity_type, p_activity_details, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;