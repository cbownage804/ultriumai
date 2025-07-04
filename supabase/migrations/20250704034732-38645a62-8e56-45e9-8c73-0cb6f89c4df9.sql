-- Create audit logs table for security tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security settings table
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  ip_whitelist TEXT[],
  session_timeout_minutes INTEGER DEFAULT 60,
  login_notifications BOOLEAN DEFAULT true,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login_at TIMESTAMP WITH TIME ZONE,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- Security settings policies
CREATE POLICY "Users can view their own security settings" 
ON public.security_settings FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own security settings" 
ON public.security_settings FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own security settings" 
ON public.security_settings FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Add trigger for security settings updated_at
CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_security_settings_user_id ON public.security_settings(user_id);