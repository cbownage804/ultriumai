-- Add missing SafeAV quarantine table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.safe_av_quarantine (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.safe_av_scans(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  threat_name TEXT NOT NULL,
  threat_type TEXT NOT NULL,
  quarantined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'restored', 'deleted')),
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing SafeMDR incident response table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.safe_mdr_incident_response (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID REFERENCES public.safe_mdr_alerts(id),
  investigation_id UUID REFERENCES public.safe_mdr_investigations(id),
  incident_type TEXT NOT NULL,
  response_actions JSONB DEFAULT '[]',
  containment_status TEXT DEFAULT 'pending' CHECK (containment_status IN ('pending', 'partial', 'complete')),
  eradication_status TEXT DEFAULT 'pending' CHECK (eradication_status IN ('pending', 'in_progress', 'complete')),
  recovery_status TEXT DEFAULT 'pending' CHECK (recovery_status IN ('pending', 'in_progress', 'complete')),
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'safe_av_quarantine') THEN
    ALTER TABLE public.safe_av_quarantine ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own quarantine" ON public.safe_av_quarantine;
    CREATE POLICY "Users can manage their own quarantine"
    ON public.safe_av_quarantine
    FOR ALL
    USING (user_id = auth.uid());
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'safe_mdr_incident_response') THEN
    ALTER TABLE public.safe_mdr_incident_response ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their own incident response" ON public.safe_mdr_incident_response;
    CREATE POLICY "Users can manage their own incident response"
    ON public.safe_mdr_incident_response
    FOR ALL
    USING (user_id = auth.uid());
  END IF;
END $$;