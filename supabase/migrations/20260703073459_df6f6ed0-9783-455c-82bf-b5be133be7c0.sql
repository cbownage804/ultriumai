
CREATE TABLE public.ray_log_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid NULL,
  source_kind text NOT NULL DEFAULT 'unknown',
  input_label text NULL,
  total_lines integer NOT NULL DEFAULT 0,
  total_bytes integer NOT NULL DEFAULT 0,
  chunk_count integer NOT NULL DEFAULT 0,
  chunks_complete integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','mapping','reducing','complete','failed')),
  summary text NULL,
  executive_summary text NULL,
  critical_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  mitre jsonb NOT NULL DEFAULT '[]'::jsonb,
  iocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_ray_compute integer NOT NULL DEFAULT 0,
  model text NULL,
  duration_ms integer NULL,
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_log_analyses TO authenticated;
GRANT ALL ON public.ray_log_analyses TO service_role;

ALTER TABLE public.ray_log_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own log analyses"
  ON public.ray_log_analyses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_log_analyses_user_idx
  ON public.ray_log_analyses (user_id, created_at DESC);

CREATE TABLE public.ray_log_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.ray_log_analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  line_start integer NOT NULL,
  line_end integer NOT NULL,
  summary text NULL,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  iocs jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_log_chunks TO authenticated;
GRANT ALL ON public.ray_log_chunks TO service_role;

ALTER TABLE public.ray_log_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own log chunks"
  ON public.ray_log_chunks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_log_chunks_analysis_idx
  ON public.ray_log_chunks (analysis_id, chunk_index);
