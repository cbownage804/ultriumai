
-- Phase 1: GPT Data Sources
CREATE TABLE public.gpt_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gpt_id UUID NOT NULL REFERENCES public.custom_gpts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  allowed_columns TEXT[] DEFAULT '{}',
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gpt_id, table_name)
);

ALTER TABLE public.gpt_data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own data sources" ON public.gpt_data_sources
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Phase 2: AI Agents
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_table TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  system_prompt TEXT,
  output_mapping JSONB DEFAULT '{}',
  credit_budget INTEGER DEFAULT 100,
  credits_used INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  template_id TEXT,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agents" ON public.ai_agents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Phase 2: AI Agent Runs
CREATE TABLE public.ai_agent_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  credits_used NUMERIC DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own agent runs" ON public.ai_agent_runs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_gpt_data_sources_gpt_id ON public.gpt_data_sources(gpt_id);
CREATE INDEX idx_ai_agents_user_id ON public.ai_agents(user_id);
CREATE INDEX idx_ai_agent_runs_agent_id ON public.ai_agent_runs(agent_id);
CREATE INDEX idx_ai_agent_runs_created_at ON public.ai_agent_runs(created_at DESC);
