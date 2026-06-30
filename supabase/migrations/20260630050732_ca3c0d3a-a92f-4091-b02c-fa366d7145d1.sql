
-- 1. ray_insights — the unified Ray feed
CREATE TABLE IF NOT EXISTS public.ray_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,                  -- e.g. 'breach', 'weak_password', 'mfa_missing', 'device_offline', 'identity_exposure', 'observation'
  area text NOT NULL,                  -- 'passwords' | 'threats' | 'exposure' | 'identity' | 'devices' | 'home'
  severity text NOT NULL DEFAULT 'info', -- 'info' | 'low' | 'medium' | 'high' | 'critical'
  title text NOT NULL,
  body text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open', -- 'open' | 'acknowledged' | 'resolved' | 'dismissed'
  recommended_action text,
  page_context text,                   -- canonical route, e.g. '/app/passwords'
  expires_at timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ray_insights_user_area ON public.ray_insights(user_id, area);
CREATE INDEX IF NOT EXISTS idx_ray_insights_user_status ON public.ray_insights(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ray_insights_user_observed ON public.ray_insights(user_id, observed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_insights TO authenticated;
GRANT ALL ON public.ray_insights TO service_role;

ALTER TABLE public.ray_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ray insights"
  ON public.ray_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ray insights"
  ON public.ray_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ray insights"
  ON public.ray_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ray insights"
  ON public.ray_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_ray_insights_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ray_insights_updated_at
  BEFORE UPDATE ON public.ray_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_ray_insights_updated_at();

-- 2. Add timezone + last_seen_at to ray_profiles so the Morning Brief cron can target users.
ALTER TABLE public.ray_profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

UPDATE public.ray_profiles
  SET last_seen_at = COALESCE(last_seen_at, onboarded_at, created_at)
  WHERE last_seen_at IS NULL;
