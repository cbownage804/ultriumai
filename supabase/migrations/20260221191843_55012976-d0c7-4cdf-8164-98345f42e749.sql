
-- Build jobs table for server-side generation
CREATE TABLE public.app_builder_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'streaming', 'completed', 'failed', 'cancelled')),
  
  -- Input
  input_messages JSONB NOT NULL,
  input_mode TEXT NOT NULL DEFAULT 'build',
  input_model TEXT,
  supabase_config JSONB,
  stripe_config JSONB,
  active_services JSONB DEFAULT '[]'::jsonb,
  current_files JSONB DEFAULT '[]'::jsonb,
  
  -- Output
  output_content TEXT,
  output_files JSONB,
  output_deletions JSONB,
  output_edits JSONB,
  output_migrations JSONB,
  output_edge_functions JSONB,
  error_message TEXT,
  
  -- Progress
  progress_percent INTEGER DEFAULT 0,
  bytes_received INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_builder_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.app_builder_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
  ON public.app_builder_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.app_builder_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON public.app_builder_jobs FOR ALL
  USING (public.is_service_role());

-- Index for polling
CREATE INDEX idx_app_builder_jobs_user_status ON public.app_builder_jobs (user_id, status);
CREATE INDEX idx_app_builder_jobs_created ON public.app_builder_jobs (created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_app_builder_jobs_updated_at
  BEFORE UPDATE ON public.app_builder_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atlas_updated_at();
