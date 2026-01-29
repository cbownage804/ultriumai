-- Create conversion funnel analytics tables
BEGIN;

-- Funnel events table for tracking conversion steps
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  funnel_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  product TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Index for efficient querying
CREATE INDEX idx_funnel_events_funnel_step ON public.funnel_events(funnel_name, step_name);
CREATE INDEX idx_funnel_events_created_at ON public.funnel_events(created_at);
CREATE INDEX idx_funnel_events_session ON public.funnel_events(session_id);

-- Enable RLS
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Policies: service role can insert (for edge functions), admins can view
CREATE POLICY "Service role can insert funnel events"
ON public.funnel_events FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can manage funnel events"
ON public.funnel_events FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view funnel events"
ON public.funnel_events FOR SELECT TO authenticated
USING (public.is_admin_user());

-- Conversion goals table for tracking completed conversions
CREATE TABLE IF NOT EXISTS public.conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  goal_name TEXT NOT NULL,
  goal_value NUMERIC DEFAULT 0,
  product TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversion_goals_name ON public.conversion_goals(goal_name);
CREATE INDEX idx_conversion_goals_created_at ON public.conversion_goals(created_at);

ALTER TABLE public.conversion_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage conversion goals"
ON public.conversion_goals FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view conversion goals"
ON public.conversion_goals FOR SELECT TO authenticated
USING (public.is_admin_user());

-- Allow authenticated users to insert their own events (for client-side tracking)
CREATE POLICY "Users can insert their own funnel events"
ON public.funnel_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own conversion goals"
ON public.conversion_goals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

COMMIT;