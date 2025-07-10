
-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('success', 'warning', 'error', 'info')),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('security', 'ticket', 'system', 'general')),
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create real-time alerts table
CREATE TABLE public.realtime_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    source_table TEXT,
    source_id UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user presence table
CREATE TABLE public.user_presence (
    user_id UUID NOT NULL PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    current_page TEXT,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    ticket_updates BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- RLS Policies for realtime_alerts
CREATE POLICY "Users can view their own alerts" 
ON public.realtime_alerts FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own alerts" 
ON public.realtime_alerts FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can manage alerts" 
ON public.realtime_alerts FOR ALL 
USING (true);

-- RLS Policies for user_presence
CREATE POLICY "Users can view all user presence" 
ON public.user_presence FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences FOR ALL 
USING (user_id = auth.uid());

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_presence_updated_at();

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT 'general',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, category, action_url, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_category, p_action_url, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
