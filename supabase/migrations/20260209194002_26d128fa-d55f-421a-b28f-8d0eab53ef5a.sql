
-- Drop the partially created tables from the failed migration and recreate all except software_licenses
DROP TABLE IF EXISTS public.application_crashes CASCADE;
DROP TABLE IF EXISTS public.service_auto_restart_rules CASCADE;
DROP TABLE IF EXISTS public.rmm_report_schedules CASCADE;
DROP TABLE IF EXISTS public.software_deployment_jobs CASCADE;
DROP TABLE IF EXISTS public.script_execution_jobs CASCADE;

-- Application Crashes table
CREATE TABLE public.application_crashes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  device_name TEXT NOT NULL,
  application TEXT NOT NULL,
  version TEXT,
  crash_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_type TEXT NOT NULL,
  error_message TEXT,
  stack_trace TEXT,
  occurrences INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.application_crashes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own crashes" ON public.application_crashes FOR ALL USING (auth.uid() = user_id);

-- Service Auto-Restart Rules table
CREATE TABLE public.service_auto_restart_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  display_name TEXT,
  enabled BOOLEAN DEFAULT true,
  max_restarts INTEGER DEFAULT 3,
  restart_delay INTEGER DEFAULT 30,
  current_restarts INTEGER DEFAULT 0,
  last_restart TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'monitoring',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.service_auto_restart_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own restart rules" ON public.service_auto_restart_rules FOR ALL USING (auth.uid() = user_id);

-- RMM Report Schedules table
CREATE TABLE public.rmm_report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL DEFAULT 'executive',
  sections JSONB DEFAULT '[]',
  frequency TEXT,
  recipients JSONB DEFAULT '[]',
  is_enabled BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.rmm_report_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own report schedules" ON public.rmm_report_schedules FOR ALL USING (auth.uid() = user_id);

-- Software Deployment Jobs table
CREATE TABLE public.software_deployment_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT DEFAULT 'install',
  package_name TEXT NOT NULL,
  package_source TEXT DEFAULT 'chocolatey',
  target_device_ids JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  results JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.software_deployment_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own deployments" ON public.software_deployment_jobs FOR ALL USING (auth.uid() = user_id);

-- Script Execution Jobs table
CREATE TABLE public.script_execution_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  script TEXT NOT NULL,
  shell TEXT DEFAULT 'powershell',
  target_device_ids JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  results JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.script_execution_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own script jobs" ON public.script_execution_jobs FOR ALL USING (auth.uid() = user_id);
