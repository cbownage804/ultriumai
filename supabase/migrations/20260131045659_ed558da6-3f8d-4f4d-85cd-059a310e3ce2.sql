-- Internal ticket notes (MSP-only, invisible to clients)
CREATE TABLE public.vanguard_internal_ticket_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.vanguard_service_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note_content TEXT NOT NULL,
  note_type TEXT DEFAULT 'internal' CHECK (note_type IN ('internal', 'escalation', 'handoff', 'ai_suggestion')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Performance Reviews for technicians
CREATE TABLE public.vanguard_ai_performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  technician_name TEXT NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  -- Metrics
  tickets_resolved INTEGER DEFAULT 0,
  tickets_assigned INTEGER DEFAULT 0,
  avg_resolution_time_hours NUMERIC(10,2),
  sla_compliance_rate NUMERIC(5,2),
  first_response_avg_minutes NUMERIC(10,2),
  csat_average NUMERIC(3,2),
  escalation_rate NUMERIC(5,2),
  reopen_rate NUMERIC(5,2),
  -- AI Analysis
  ai_summary TEXT,
  strengths JSONB DEFAULT '[]',
  improvement_areas JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  performance_score NUMERIC(5,2),
  trend_vs_previous TEXT CHECK (trend_vs_previous IN ('improving', 'stable', 'declining')),
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'shared', 'acknowledged')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  shared_with_technician BOOLEAN DEFAULT false,
  technician_acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Technician performance snapshots (for trend tracking)
CREATE TABLE public.vanguard_technician_metrics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  tickets_resolved INTEGER DEFAULT 0,
  tickets_assigned INTEGER DEFAULT 0,
  avg_resolution_hours NUMERIC(10,2),
  sla_compliance NUMERIC(5,2),
  csat_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vanguard_internal_ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_ai_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_technician_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their internal notes" ON public.vanguard_internal_ticket_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their performance reviews" ON public.vanguard_ai_performance_reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their metric snapshots" ON public.vanguard_technician_metrics_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_internal_notes_ticket ON public.vanguard_internal_ticket_notes(ticket_id);
CREATE INDEX idx_performance_reviews_tech ON public.vanguard_ai_performance_reviews(technician_id);
CREATE INDEX idx_metrics_snapshots_tech_date ON public.vanguard_technician_metrics_snapshots(technician_id, snapshot_date);