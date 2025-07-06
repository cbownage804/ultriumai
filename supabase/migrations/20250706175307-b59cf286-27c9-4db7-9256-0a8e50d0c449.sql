-- Step 3: Create new indexes for renamed tables
CREATE INDEX idx_safe_shield_endpoints_user_id ON public.safe_shield_endpoints(user_id);
CREATE INDEX idx_safe_shield_endpoints_status ON public.safe_shield_endpoints(status);
CREATE INDEX idx_safe_shield_threats_user_id ON public.safe_shield_threats(user_id);
CREATE INDEX idx_safe_shield_threats_severity ON public.safe_shield_threats(severity);
CREATE INDEX idx_safe_shield_threats_detected_at ON public.safe_shield_threats(detected_at);
CREATE INDEX idx_safe_shield_actions_user_id ON public.safe_shield_actions(user_id);

-- Step 4: Add new tables for SafeAV (Antivirus) functionality
CREATE TABLE public.safe_av_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_id UUID,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('quick', 'full', 'custom', 'real_time')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  files_scanned INTEGER DEFAULT 0,
  threats_found INTEGER DEFAULT 0,
  threats_quarantined INTEGER DEFAULT 0,
  scan_results JSONB DEFAULT '{}',
  scan_path TEXT,
  scan_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.safe_av_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  definition_version TEXT NOT NULL,
  update_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_signatures INTEGER DEFAULT 0,
  engine_version TEXT,
  update_status TEXT NOT NULL DEFAULT 'current',
  next_update_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Add new tables for SafeMDR (Managed Detection & Response) functionality
CREATE TABLE public.safe_mdr_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_client_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_system TEXT,
  affected_assets TEXT[],
  tactics JSONB DEFAULT '[]',
  techniques JSONB DEFAULT '[]',
  indicators JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'confirmed', 'false_positive', 'resolved')),
  assigned_to UUID,
  escalation_level INTEGER DEFAULT 0,
  response_actions JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  remediation_steps TEXT,
  analyst_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);