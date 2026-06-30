
CREATE TABLE public.ray_account_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  last_playbook_slug TEXT,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_account_health TO authenticated;
GRANT ALL ON public.ray_account_health TO service_role;

ALTER TABLE public.ray_account_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own account health"
  ON public.ray_account_health FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ray_account_health_user ON public.ray_account_health(user_id);

CREATE TRIGGER update_ray_account_health_updated_at
  BEFORE UPDATE ON public.ray_account_health
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
