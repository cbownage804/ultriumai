
-- Ray Memory: long-term facts about the user
CREATE TABLE IF NOT EXISTS public.ray_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'inferred',
  confidence numeric NOT NULL DEFAULT 0.8,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_memory TO authenticated;
GRANT ALL ON public.ray_memory TO service_role;
ALTER TABLE public.ray_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own ray memory" ON public.ray_memory
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ray_memory_user_idx ON public.ray_memory(user_id);

-- Ray Timeline: append-only event log
CREATE TABLE IF NOT EXISTS public.ray_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'info',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ray_timeline TO authenticated;
GRANT ALL ON public.ray_timeline TO service_role;
ALTER TABLE public.ray_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own ray timeline" ON public.ray_timeline
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own ray timeline" ON public.ray_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ray_timeline_user_occurred_idx ON public.ray_timeline(user_id, occurred_at DESC);

-- Ray Briefings: cached morning briefing
CREATE TABLE IF NOT EXISTS public.ray_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  greeting text NOT NULL,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_briefings TO authenticated;
GRANT ALL ON public.ray_briefings TO service_role;
ALTER TABLE public.ray_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own ray briefings" ON public.ray_briefings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ray_briefings_user_generated_idx ON public.ray_briefings(user_id, generated_at DESC);

-- Extend ray_recommendations
ALTER TABLE public.ray_recommendations
  ADD COLUMN IF NOT EXISTS dismissed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_fix_seconds integer,
  ADD COLUMN IF NOT EXISTS page_context text;
CREATE INDEX IF NOT EXISTS ray_recs_user_page_idx ON public.ray_recommendations(user_id, page_context) WHERE dismissed_at IS NULL AND completed_at IS NULL;
