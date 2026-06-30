
-- Ray Briefs: persistent morning briefings (structured + AI summary)
CREATE TABLE IF NOT EXISTS public.ray_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_date date NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  source text NOT NULL DEFAULT 'lazy',
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  score_delta integer,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  greeting text,
  summary text,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  guidance text,
  ai_status text NOT NULL DEFAULT 'pending',
  generation_ms integer,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, brief_date)
);

CREATE INDEX IF NOT EXISTS idx_ray_briefs_user_date ON public.ray_briefs (user_id, brief_date DESC);
CREATE INDEX IF NOT EXISTS idx_ray_briefs_generated ON public.ray_briefs (generated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_briefs TO authenticated;
GRANT ALL ON public.ray_briefs TO service_role;

ALTER TABLE public.ray_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own briefs" ON public.ray_briefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own briefs" ON public.ray_briefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own briefs" ON public.ray_briefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own briefs" ON public.ray_briefs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_ray_briefs_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.update_ray_briefs_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_ray_briefs_updated_at ON public.ray_briefs;
CREATE TRIGGER trg_ray_briefs_updated_at
  BEFORE UPDATE ON public.ray_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_ray_briefs_updated_at();
