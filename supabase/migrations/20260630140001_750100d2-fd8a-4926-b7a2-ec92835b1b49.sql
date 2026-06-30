
CREATE TABLE public.ray_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  prepared_answer JSONB,
  entity_kind TEXT,
  entity_id TEXT,
  priority INTEGER NOT NULL DEFAULT 50,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'open',
  snoozed_until TIMESTAMPTZ,
  source_signal TEXT,
  dedupe_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT ray_notices_status_check CHECK (status IN ('open','snoozed','dismissed','resolved')),
  CONSTRAINT ray_notices_user_dedupe_unique UNIQUE (user_id, dedupe_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_notices TO authenticated;
GRANT ALL ON public.ray_notices TO service_role;

ALTER TABLE public.ray_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ray notices"
  ON public.ray_notices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_notices_user_status_idx ON public.ray_notices (user_id, status, priority DESC, created_at DESC);

CREATE TRIGGER trg_ray_notices_updated_at
  BEFORE UPDATE ON public.ray_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
