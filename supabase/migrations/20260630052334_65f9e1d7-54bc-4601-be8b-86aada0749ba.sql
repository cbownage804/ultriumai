
CREATE TABLE public.ray_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  reward_points INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'new',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress NUMERIC NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 5,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_missions TO authenticated;
GRANT ALL ON public.ray_missions TO service_role;

ALTER TABLE public.ray_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own missions"
  ON public.ray_missions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_missions_user_status_idx
  ON public.ray_missions (user_id, status, priority);

CREATE TRIGGER ray_missions_updated_at
  BEFORE UPDATE ON public.ray_missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
