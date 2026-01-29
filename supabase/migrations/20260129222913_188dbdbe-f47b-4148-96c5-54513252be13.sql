-- Vanguard Technicians for Smart Routing
CREATE TABLE public.vanguard_technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  email TEXT,
  skills TEXT[] DEFAULT '{}',
  active_tickets INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 8,
  avg_resolution_time_minutes INTEGER DEFAULT 120,
  rating NUMERIC(3,2) DEFAULT 4.5,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away', 'offline')),
  is_senior BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Routing Rules for Smart Ticket Router
CREATE TABLE public.vanguard_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  condition_field TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_target TEXT,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket Category Distribution (aggregated stats)
CREATE TABLE public.vanguard_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  ticket_count INTEGER DEFAULT 0,
  percentage NUMERIC(5,2) DEFAULT 0,
  color TEXT DEFAULT '#22d3ee',
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pattern Detection Results
CREATE TABLE public.vanguard_detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_name TEXT NOT NULL,
  category TEXT,
  occurrences INTEGER DEFAULT 0,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('rising', 'stable', 'declining')),
  trend_percent NUMERIC(5,2) DEFAULT 0,
  affected_clients INTEGER DEFAULT 0,
  avg_resolution_time_minutes INTEGER,
  suggested_kb BOOLEAN DEFAULT false,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  root_cause TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pattern Trend Data (time series)
CREATE TABLE public.vanguard_pattern_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_id UUID REFERENCES public.vanguard_detected_patterns(id) ON DELETE CASCADE,
  trend_date DATE NOT NULL,
  occurrence_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API Marketplace Connections
CREATE TABLE public.vanguard_marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_id TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('connected', 'available', 'coming_soon', 'error')),
  configuration JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, integration_id)
);

-- Executive Dashboard Trend Data
CREATE TABLE public.vanguard_security_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trend_date DATE NOT NULL,
  threats_detected INTEGER DEFAULT 0,
  threats_blocked INTEGER DEFAULT 0,
  incidents_opened INTEGER DEFAULT 0,
  incidents_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trend_date)
);

-- Notification Trigger Settings
CREATE TABLE public.vanguard_notification_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_label TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  notification_channels JSONB DEFAULT '["email"]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_type)
);

-- Enable RLS on all tables
ALTER TABLE public.vanguard_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_detected_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_pattern_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_security_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_notification_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own technicians" ON public.vanguard_technicians FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own routing rules" ON public.vanguard_routing_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ticket categories" ON public.vanguard_ticket_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own detected patterns" ON public.vanguard_detected_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own pattern trends" ON public.vanguard_pattern_trends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own marketplace connections" ON public.vanguard_marketplace_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own security trends" ON public.vanguard_security_trends FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notification triggers" ON public.vanguard_notification_triggers FOR ALL USING (auth.uid() = user_id);