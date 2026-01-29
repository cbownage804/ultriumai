-- Create onboarding progress table for cross-device persistence
CREATE TABLE public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  progress_type TEXT NOT NULL, -- 'tour', 'tip', 'tutorial', 'checklist'
  item_id TEXT NOT NULL, -- The specific tour/tip/tutorial ID
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT FALSE,
  step_reached INTEGER DEFAULT 0, -- For multi-step tours
  variant TEXT, -- For A/B testing
  metadata JSONB DEFAULT '{}'::jsonb, -- Extra data like engagement time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, progress_type, item_id)
);

-- Create onboarding analytics table for A/B testing
CREATE TABLE public.onboarding_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'tip_shown', 'tip_clicked', 'tour_started', 'tour_completed', etc.
  item_id TEXT NOT NULL,
  variant TEXT, -- A/B test variant
  step_number INTEGER,
  engagement_ms INTEGER, -- How long user spent
  action_taken TEXT, -- 'dismiss', 'next', 'skip', 'complete', 'interact'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create smart triggers table for behavioral tips
CREATE TABLE public.onboarding_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL, -- 'feature_visit', 'action_count', 'time_based'
  feature_id TEXT NOT NULL,
  visit_count INTEGER DEFAULT 0,
  action_count INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  tip_shown BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trigger_type, feature_id)
);

-- Enable RLS on all tables
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_triggers ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_progress
CREATE POLICY "Users can view their own progress"
  ON public.onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for onboarding_analytics
CREATE POLICY "Users can view their own analytics"
  ON public.onboarding_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.onboarding_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for onboarding_triggers
CREATE POLICY "Users can view their own triggers"
  ON public.onboarding_triggers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own triggers"
  ON public.onboarding_triggers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own triggers"
  ON public.onboarding_triggers FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_triggers_updated_at
  BEFORE UPDATE ON public.onboarding_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_onboarding_progress_user ON public.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_analytics_user ON public.onboarding_analytics(user_id);
CREATE INDEX idx_onboarding_analytics_event ON public.onboarding_analytics(event_type);
CREATE INDEX idx_onboarding_triggers_user ON public.onboarding_triggers(user_id);