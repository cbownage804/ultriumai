-- Create security events table for centralized SIEM logging
CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  source_app TEXT NOT NULL, -- 'safedoc', 'safemail', 'safelink', 'safepass', 'safenet'
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  title TEXT NOT NULL,
  description TEXT,
  affected_assets TEXT[] DEFAULT '{}',
  user_email TEXT,
  ip_address INET,
  threat_indicators TEXT[] DEFAULT '{}',
  raw_data JSONB DEFAULT '{}',
  correlation_id UUID, -- For grouping related events
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create threat intelligence table
CREATE TABLE public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'hash', 'url', 'email')),
  indicator_value TEXT NOT NULL,
  threat_types TEXT[] NOT NULL DEFAULT '{}',
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  source TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert rules table
CREATE TABLE public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL, -- Query conditions for triggering alerts
  severity_threshold TEXT NOT NULL CHECK (severity_threshold IN ('low', 'medium', 'high', 'critical')),
  notification_channels JSONB NOT NULL DEFAULT '{}', -- email, webhook, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert notifications table
CREATE TABLE public.alert_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_rule_id UUID REFERENCES public.alert_rules(id),
  security_event_id UUID REFERENCES public.security_events(id),
  notification_type TEXT NOT NULL, -- 'email', 'webhook', 'sms'
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event correlations table for tracking related events
CREATE TABLE public.event_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  correlation_id UUID NOT NULL,
  primary_event_id UUID NOT NULL REFERENCES public.security_events(id),
  related_event_id UUID NOT NULL REFERENCES public.security_events(id),
  correlation_type TEXT NOT NULL, -- 'ip_match', 'user_match', 'time_based', etc.
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX idx_security_events_source_app ON public.security_events(source_app);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_status ON public.security_events(status);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_ip_address ON public.security_events(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_threat_intelligence_indicator ON public.threat_intelligence(indicator_type, indicator_value);
CREATE INDEX idx_threat_intelligence_active ON public.threat_intelligence(is_active) WHERE is_active = true;
CREATE INDEX idx_alert_rules_user_active ON public.alert_rules(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_correlations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_events
CREATE POLICY "Users can view their own security events" ON public.security_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert security events" ON public.security_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own security events" ON public.security_events
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for threat_intelligence (read-only for users, system manages)
CREATE POLICY "Users can view threat intelligence" ON public.threat_intelligence
  FOR SELECT USING (true);

CREATE POLICY "System can manage threat intelligence" ON public.threat_intelligence
  FOR ALL USING (true);

-- RLS Policies for alert_rules
CREATE POLICY "Users can manage their own alert rules" ON public.alert_rules
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for alert_notifications
CREATE POLICY "Users can view their own alert notifications" ON public.alert_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage alert notifications" ON public.alert_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update alert notifications" ON public.alert_notifications
  FOR UPDATE USING (true);

-- RLS Policies for event_correlations
CREATE POLICY "Users can view correlations for their events" ON public.event_correlations
  FOR SELECT USING (
    primary_event_id IN (
      SELECT id FROM public.security_events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage event correlations" ON public.event_correlations
  FOR ALL USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_security_events_updated_at
  BEFORE UPDATE ON public.security_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threat_intelligence_updated_at
  BEFORE UPDATE ON public.threat_intelligence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample threat intelligence data
INSERT INTO public.threat_intelligence (indicator_type, indicator_value, threat_types, confidence, source, metadata) VALUES
('ip', '192.168.100.1', ARRAY['botnet', 'scanning'], 95, 'Internal Detection', '{"description": "Known malicious IP from botnet activity"}'),
('domain', 'malicious-site.com', ARRAY['phishing', 'malware'], 90, 'External Feed', '{"description": "Known phishing domain"}'),
('hash', 'abc123def456', ARRAY['malware', 'trojan'], 98, 'VirusTotal', '{"description": "Trojan.Generic.12345"}'),
('url', 'http://fake-bank.com/login', ARRAY['phishing'], 85, 'PhishTank', '{"description": "Banking phishing page"}');

-- Enable realtime for security events
ALTER TABLE public.security_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;