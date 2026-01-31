-- Only create tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.ticket_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  queue_name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB DEFAULT '{}',
  sort_order JSONB DEFAULT '{"field": "created_at", "direction": "desc"}',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portal_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#22c55e',
  custom_css TEXT,
  custom_domain TEXT,
  footer_text TEXT,
  support_email TEXT,
  support_phone TEXT,
  welcome_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.screen_recording_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  recording_url TEXT,
  duration_seconds INTEGER,
  ai_analysis JSONB,
  generated_steps JSONB,
  kb_article_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_ticket_id TEXT NOT NULL,
  child_ticket_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'parent_child' CHECK (relationship_type IN ('parent_child', 'merged', 'related', 'duplicate')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables only
DO $$ BEGIN
  ALTER TABLE public.ticket_queues ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.portal_branding ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.screen_recording_sessions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.ticket_relationships ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create policies if they don't exist
DO $$ BEGIN
  CREATE POLICY "Users manage ticket_queues" ON public.ticket_queues FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage portal_branding" ON public.portal_branding FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage screen_recording_sessions" ON public.screen_recording_sessions FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage ticket_relationships" ON public.ticket_relationships FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ticket_queues_position ON public.ticket_queues(position);
CREATE INDEX IF NOT EXISTS idx_screen_recordings_status ON public.screen_recording_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ticket_relationships_parent ON public.ticket_relationships(parent_ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_relationships_child ON public.ticket_relationships(child_ticket_id);