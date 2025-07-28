-- Create notifications table for multi-tenant notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  msp_id UUID REFERENCES public.msps(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('success', 'warning', 'error', 'info')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('security', 'ticket', 'system', 'general', 'billing', 'client')),
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create realtime_alerts table for critical alerts
CREATE TABLE IF NOT EXISTS public.realtime_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  msp_id UUID REFERENCES public.msps(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.msp_clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_table TEXT,
  source_id UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_preferences table for user preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notification_types JSONB DEFAULT '["all"]',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "MSP users can view their MSP notifications" 
ON public.notifications 
FOR SELECT 
USING (
  msp_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.msp_staff 
    WHERE user_id = auth.uid() AND msp_id = notifications.msp_id AND is_active = true
  )
);

CREATE POLICY "Client users can view their client notifications" 
ON public.notifications 
FOR SELECT 
USING (
  client_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.client_users 
    WHERE user_id = auth.uid() AND client_id = notifications.client_id AND is_active = true
  )
);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for realtime_alerts
CREATE POLICY "Users can view their own alerts" 
ON public.realtime_alerts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "MSP users can view their MSP alerts" 
ON public.realtime_alerts 
FOR SELECT 
USING (
  msp_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.msp_staff 
    WHERE user_id = auth.uid() AND msp_id = realtime_alerts.msp_id AND is_active = true
  )
);

CREATE POLICY "Users can update their own alerts" 
ON public.realtime_alerts 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = acknowledged_by);

-- Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_msp_id ON public.notifications(msp_id);
CREATE INDEX idx_notifications_client_id ON public.notifications(client_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);

CREATE INDEX idx_realtime_alerts_user_id ON public.realtime_alerts(user_id);
CREATE INDEX idx_realtime_alerts_msp_id ON public.realtime_alerts(msp_id);
CREATE INDEX idx_realtime_alerts_severity ON public.realtime_alerts(severity);
CREATE INDEX idx_realtime_alerts_resolved_at ON public.realtime_alerts(resolved_at);

-- Enable realtime
ALTER publication supabase_realtime ADD TABLE public.notifications;
ALTER publication supabase_realtime ADD TABLE public.realtime_alerts;
ALTER publication supabase_realtime ADD TABLE public.notification_preferences;

-- Set replica identity
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.realtime_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.notification_preferences REPLICA IDENTITY FULL;

-- Update send_notification function
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT 'general',
  p_msp_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, msp_id, client_id, title, message, type, category, action_url, metadata
  )
  VALUES (
    p_user_id, p_msp_id, p_client_id, p_title, p_message, p_type, p_category, p_action_url, p_metadata
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to send alerts to all MSP staff
CREATE OR REPLACE FUNCTION public.send_msp_alert(
  p_msp_id UUID,
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  alert_ids UUID[] := '{}';
  staff_record RECORD;
  alert_id UUID;
BEGIN
  -- Send alert to all active MSP staff
  FOR staff_record IN 
    SELECT user_id FROM public.msp_staff 
    WHERE msp_id = p_msp_id AND is_active = true
  LOOP
    INSERT INTO public.realtime_alerts (
      user_id, msp_id, alert_type, severity, title, description, metadata
    )
    VALUES (
      staff_record.user_id, p_msp_id, p_alert_type, p_severity, p_title, p_description, p_metadata
    )
    RETURNING id INTO alert_id;
    
    alert_ids := array_append(alert_ids, alert_id);
  END LOOP;
  
  RETURN alert_ids;
END;
$$;