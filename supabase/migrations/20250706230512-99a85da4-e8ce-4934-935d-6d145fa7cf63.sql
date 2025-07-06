-- Create tables for functional demo systems

-- Document scanning results
CREATE TABLE IF NOT EXISTS public.document_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'completed', 'failed')),
  scan_result JSONB DEFAULT '{}',
  threat_level TEXT CHECK (threat_level IN ('clean', 'low', 'medium', 'high', 'critical', 'unknown')),
  threats_detected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Email scanning results
CREATE TABLE IF NOT EXISTS public.email_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_subject TEXT,
  sender_email TEXT NOT NULL,
  recipient_email TEXT,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'completed', 'failed')),
  scan_result JSONB DEFAULT '{}',
  threat_level TEXT CHECK (threat_level IN ('clean', 'phishing', 'malware', 'spam', 'suspicious')),
  threats_detected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Network scan results
CREATE TABLE IF NOT EXISTS public.network_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_ip TEXT NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('port_scan', 'vulnerability_scan', 'device_discovery')),
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'scanning', 'completed', 'failed')),
  scan_result JSONB DEFAULT '{}',
  vulnerabilities_found INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Password strength analysis
CREATE TABLE IF NOT EXISTS public.password_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  strength_score INTEGER NOT NULL,
  strength_level TEXT NOT NULL CHECK (strength_level IN ('very_weak', 'weak', 'fair', 'good', 'strong', 'very_strong')),
  analysis_result JSONB DEFAULT '{}',
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dark web monitoring results  
CREATE TABLE IF NOT EXISTS public.darkweb_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  monitored_item TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('email', 'domain', 'username', 'phone', 'credit_card')),
  status TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'found', 'resolved')),
  findings JSONB DEFAULT '[]',
  last_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security analytics for tracking demo usage
CREATE TABLE IF NOT EXISTS public.security_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.document_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.darkweb_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own document scans" ON public.document_scans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email scans" ON public.email_scans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own network scans" ON public.network_scans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own password scans" ON public.password_scans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own darkweb monitors" ON public.darkweb_monitors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own security analytics" ON public.security_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_document_scans_user_id ON public.document_scans(user_id);
CREATE INDEX idx_document_scans_created_at ON public.document_scans(created_at DESC);
CREATE INDEX idx_email_scans_user_id ON public.email_scans(user_id);
CREATE INDEX idx_network_scans_user_id ON public.network_scans(user_id);
CREATE INDEX idx_password_scans_user_id ON public.password_scans(user_id);
CREATE INDEX idx_darkweb_monitors_user_id ON public.darkweb_monitors(user_id);
CREATE INDEX idx_security_analytics_user_id ON public.security_analytics(user_id);
CREATE INDEX idx_security_analytics_event_type ON public.security_analytics(event_type);