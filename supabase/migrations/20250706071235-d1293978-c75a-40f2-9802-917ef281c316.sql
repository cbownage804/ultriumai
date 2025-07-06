-- Create missing tables for AI features

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  ai_suggested_solution TEXT,
  ai_confidence_score INTEGER,
  auto_resolved BOOLEAN DEFAULT false,
  resolution_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alert patterns table
CREATE TABLE public.alert_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  alert_types TEXT[] NOT NULL,
  confidence_threshold INTEGER NOT NULL DEFAULT 80,
  auto_resolve BOOLEAN DEFAULT false,
  resolution_action TEXT,
  success_rate INTEGER DEFAULT 75,
  total_matches INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patching policies table
CREATE TABLE public.patching_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  auto_patch_windows BOOLEAN DEFAULT false,
  auto_patch_third_party BOOLEAN DEFAULT false,
  maintenance_window_start TEXT,
  maintenance_window_end TEXT,
  critical_patch_immediate BOOLEAN DEFAULT true,
  ai_risk_assessment BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patching_policies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "MSPs can manage their client tickets" ON public.support_tickets
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "MSPs can manage alert patterns" ON public.alert_patterns
FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "MSPs can manage patching policies" ON public.patching_policies
FOR ALL USING (
  client_id IN (
    SELECT id FROM public.msp_clients 
    WHERE msp_id IN (
      SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
  )
);