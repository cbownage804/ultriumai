-- Add missing SafeAV quarantine table
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

-- Add missing SafeMDR incident response table
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

-- Enable RLS on new tables
ALTER TABLE IF EXISTS public.safe_av_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.safe_mdr_incident_response ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
DROP POLICY IF EXISTS "Users can manage their own quarantine" ON public.safe_av_quarantine;
CREATE POLICY "Users can manage their own quarantine"
ON public.safe_av_quarantine
FOR ALL
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own incident response" ON public.safe_mdr_incident_response;
CREATE POLICY "Users can manage their own incident response"
ON public.safe_mdr_incident_response
FOR ALL
USING (user_id = auth.uid());

-- Insert sample data for development/demo
-- SafeAV Sample Definitions
INSERT INTO public.safe_av_definitions (user_id, definition_version, update_date, total_signatures, engine_version, update_status, next_update_check)
SELECT 
  auth.uid(),
  '2024.12.07.001',
  now(),
  8765432,
  '3.2.1',
  'current',
  now() + interval '24 hours'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- SafeShield Sample Endpoints
INSERT INTO public.safe_shield_endpoints (user_id, hostname, ip_address, mac_address, os_type, os_version, status, protection_status, threat_count)
SELECT 
  auth.uid(),
  hostname,
  ip_address::inet,
  mac_address,
  os_type,
  os_version,
  status,
  protection_status,
  threat_count
FROM (VALUES
  ('WORKSTATION-001', '192.168.1.100', '00:1B:44:11:3A:B7', 'windows', 'Windows 11 Pro', 'online', 'protected', 0),
  ('LAPTOP-SALES-02', '192.168.1.101', '00:1B:44:11:3A:B8', 'windows', 'Windows 10 Pro', 'online', 'protected', 2),
  ('SERVER-DC-01', '192.168.1.10', '00:1B:44:11:3A:C1', 'windows', 'Windows Server 2022', 'online', 'protected', 0),
  ('MACBOOK-DEV-01', '192.168.1.102', '00:1B:44:11:3A:B9', 'macos', 'macOS Sonoma 14.1', 'online', 'protected', 0),
  ('UBUNTU-SRV-01', '192.168.1.20', '00:1B:44:11:3A:D1', 'linux', 'Ubuntu 22.04 LTS', 'online', 'protected', 1)
) AS sample_data(hostname, ip_address, mac_address, os_type, os_version, status, protection_status, threat_count)
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- SafeAV Sample Scans
INSERT INTO public.safe_av_scans (user_id, scan_type, status, started_at, completed_at, files_scanned, threats_found, threats_quarantined, scan_duration_seconds, scan_path)
SELECT 
  auth.uid(),
  scan_type,
  status,
  started_at,
  completed_at,
  files_scanned,
  threats_found,
  threats_quarantined,
  scan_duration_seconds,
  scan_path
FROM (VALUES
  ('full', 'completed', now() - interval '2 hours', now() - interval '1 hour 30 minutes', 245678, 3, 3, 1800, 'C:\'),
  ('quick', 'completed', now() - interval '6 hours', now() - interval '5 hours 55 minutes', 12456, 1, 1, 300, 'C:\Windows\System32'),
  ('quick', 'completed', now() - interval '1 day', now() - interval '1 day' + interval '5 minutes', 11234, 0, 0, 280, 'C:\Windows\System32'),
  ('full', 'completed', now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 289456, 2, 2, 7200, 'C:\'),
  ('real_time', 'running', now() - interval '30 minutes', null, 0, 0, 0, null, 'Real-time Protection')
) AS sample_data(scan_type, status, started_at, completed_at, files_scanned, threats_found, threats_quarantined, scan_duration_seconds, scan_path)
WHERE auth.uid() IS NOT NULL;

-- SafeMDR Sample Alerts
INSERT INTO public.safe_mdr_alerts (user_id, alert_type, severity, title, description, status, source_system, affected_assets, escalation_level, tactics, techniques, indicators, confidence_score)
SELECT 
  auth.uid(),
  alert_type,
  severity,
  title,
  description,
  status,
  source_system,
  affected_assets,
  escalation_level,
  tactics,
  techniques,
  indicators::jsonb,
  confidence_score
FROM (VALUES
  ('Suspicious Process Execution', 'high', 'Suspicious PowerShell Activity Detected', 'Unusual PowerShell execution with obfuscated commands detected on WORKSTATION-001', 'investigating', 'SafeShield EDR', ARRAY['WORKSTATION-001'], 1, ARRAY['T1059'], ARRAY['Command and Scripting Interpreter'], '[{"type":"file_hash","value":"sha256:abc123def456","confidence":90}]', 85),
  ('Malware Detection', 'critical', 'Trojan.Win32.Agent Detected', 'Critical malware detected and quarantined on LAPTOP-SALES-02', 'resolved', 'SafeShield EDR', ARRAY['LAPTOP-SALES-02'], 2, ARRAY['T1055'], ARRAY['Process Injection'], '[{"type":"file_path","value":"C:\\temp\\malware.exe","confidence":95}]', 95),
  ('Network Anomaly', 'medium', 'Unusual Outbound Traffic', 'Suspicious network traffic detected from SERVER-DC-01 to external IP', 'new', 'SafeShield EDR', ARRAY['SERVER-DC-01'], 0, ARRAY['T1041'], ARRAY['Exfiltration Over C2 Channel'], '[{"type":"ip_address","value":"203.0.113.42","confidence":75}]', 75),
  ('Data Exfiltration', 'high', 'Large Data Transfer Detected', 'Unusual large data transfer detected from file server', 'confirmed', 'SafeShield EDR', ARRAY['SERVER-DC-01'], 1, ARRAY['T1048'], ARRAY['Exfiltration Over Alternative Protocol'], '[{"type":"file_size","value":"500MB","confidence":80}]', 80)
) AS sample_data(alert_type, severity, title, description, status, source_system, affected_assets, escalation_level, tactics, techniques, indicators, confidence_score)
WHERE auth.uid() IS NOT NULL;