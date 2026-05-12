CREATE TABLE IF NOT EXISTS public.ai_builder_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  project_id TEXT,
  phase TEXT NOT NULL,
  category TEXT NOT NULL,
  error_message TEXT NOT NULL,
  file_path TEXT,
  attempt INTEGER,
  model_used TEXT,
  prompt_version TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_builder_failures_user ON public.ai_builder_failures(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_builder_failures_category ON public.ai_builder_failures(category, created_at DESC);

ALTER TABLE public.ai_builder_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_failures"
  ON public.ai_builder_failures
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_role_inserts_failures"
  ON public.ai_builder_failures
  FOR INSERT
  TO service_role
  WITH CHECK (true);