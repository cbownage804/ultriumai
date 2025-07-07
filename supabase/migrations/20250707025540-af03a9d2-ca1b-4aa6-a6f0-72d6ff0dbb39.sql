-- Temporarily disable the trigger to insert sample data
ALTER TABLE public.security_events DISABLE TRIGGER ALL;

-- Populate RMM Devices with sample data
INSERT INTO public.rmm_devices (
  hostname, ip_address, device_type, os_info, status, last_seen, cpu_usage, memory_usage, disk_usage, last_logged_user, customer_id
) VALUES 
  ('SRV-DC-01', '192.168.1.10', 'server', 'Windows Server 2022', 'online', now() - interval '5 minutes', 15, 45, 30, 'Administrator', null),
  ('SRV-FILE-01', '192.168.1.11', 'server', 'Windows Server 2019', 'online', now() - interval '2 minutes', 8, 60, 75, 'SYSTEM', null),
  ('SRV-SQL-01', '192.168.1.12', 'server', 'Windows Server 2022', 'online', now() - interval '1 minute', 25, 80, 55, 'sa', null),
  ('WS-ADMIN-01', '192.168.1.100', 'workstation', 'Windows 11 Pro', 'online', now() - interval '10 minutes', 12, 35, 40, 'john.doe', null),
  ('WS-SALES-01', '192.168.1.101', 'workstation', 'Windows 10 Pro', 'online', now() - interval '15 minutes', 20, 50, 65, 'jane.smith', null),
  ('WS-DEV-01', '192.168.1.102', 'workstation', 'Windows 11 Pro', 'online', now() - interval '30 minutes', 45, 70, 80, 'mike.wilson', null),
  ('LT-MOBILE-01', '192.168.1.150', 'laptop', 'Windows 11 Home', 'offline', now() - interval '2 hours', 0, 0, 0, 'sarah.johnson', null),
  ('SRV-BACKUP-01', '192.168.1.20', 'server', 'Ubuntu Server 22.04', 'online', now() - interval '3 minutes', 5, 25, 90, 'root', null);

-- Create sample MSP and clients first
INSERT INTO public.msps (user_id, company_name, contact_email, phone, address, subscription_tier)
SELECT auth.uid(), 'Demo MSP Company', 'demo@msp.com', '+1-555-0000', '100 MSP Street, Demo City, DC 00000', 'premium'
WHERE NOT EXISTS (SELECT 1 FROM public.msps WHERE user_id = auth.uid());

-- Populate Security Events with sample data (with trigger disabled)
INSERT INTO public.security_events (
  user_id, source_app, event_type, severity, status, title, description, affected_assets, user_email, ip_address, threat_indicators, raw_data
) VALUES 
  (auth.uid(), 'safedoc', 'malware_detected', 'medium', 'open', 'Suspicious File Detected', 'Potentially malicious file detected in document scan', ARRAY['WS-ADMIN-01'], 'john.doe@company.com', '192.168.1.100', ARRAY['hash:a1b2c3d4e5f6'], '{"scan_engine": "ClamAV", "file_size": 2048576}'::jsonb),
  (auth.uid(), 'safemail', 'spam_detected', 'low', 'resolved', 'Spam Email Blocked', 'Spam email automatically blocked by filter', ARRAY['mail-server'], 'jane.smith@company.com', '203.0.113.45', ARRAY['url:spam-site.com'], '{"sender": "spam@fake.com", "subject": "You Won Money"}'::jsonb),
  (auth.uid(), 'safelink', 'suspicious_url', 'medium', 'resolved', 'Suspicious URL Accessed', 'Employee attempted to access suspicious website', ARRAY['WS-SALES-01'], 'jane.smith@company.com', '192.168.1.101', ARRAY['url:suspicious-site.net'], '{"blocked": true, "category": "suspicious"}'::jsonb),
  (auth.uid(), 'safepass', 'weak_password', 'low', 'open', 'Weak Password Detected', 'User account has weak password that should be updated', ARRAY['AD-Controller'], 'mike.wilson@company.com', '192.168.1.102', ARRAY['user:mike.wilson'], '{"password_strength": 2, "last_changed": "2023-01-15"}'::jsonb),
  (auth.uid(), 'safenet', 'unusual_traffic', 'medium', 'open', 'Unusual Network Traffic', 'Abnormal data transfer detected from workstation', ARRAY['WS-DEV-01'], null, '192.168.1.102', ARRAY['traffic:anomaly'], '{"bytes_transferred": 10485760, "destination": "external"}'::jsonb);

-- Re-enable the trigger
ALTER TABLE public.security_events ENABLE TRIGGER ALL;

-- Continue with other sample data
INSERT INTO public.threat_intelligence (
  user_id, indicator_type, indicator_value, reputation, score, threats, sources, last_analyzed, confidence, is_active
) VALUES 
  (auth.uid(), 'ip', '203.0.113.45', 'malicious', 95, '{"malware": ["Botnet C2"], "phishing": true}'::jsonb, '["VirusTotal", "AbuseIPDB"]'::jsonb, now() - interval '1 hour', 90, true),
  (auth.uid(), 'domain', 'malicious-site.com', 'suspicious', 75, '{"categories": ["malware", "phishing"]}'::jsonb, '["OpenPhish", "PhishTank"]'::jsonb, now() - interval '2 hours', 85, true),
  (auth.uid(), 'hash', 'a1b2c3d4e5f6789012345678901234567890abcd', 'malicious', 98, '{"family": "Trojan.PDF", "behavior": ["file_encryption"]}'::jsonb, '["VirusTotal", "Hybrid Analysis"]'::jsonb, now() - interval '30 minutes', 95, true);

-- Sample document scans
INSERT INTO public.document_scans (
  user_id, file_name, file_hash, file_size, scan_status, threat_level, threats_detected, completed_at, scan_result
) VALUES 
  (auth.uid(), 'quarterly_report.pdf', 'a1b2c3d4e5f6789012345678901234567890abcd', 2048576, 'completed', 'medium', 1, now() - interval '1 hour', '{"engine": "ClamAV", "threats": ["Suspicious.PDF"], "action": "quarantined"}'::jsonb),
  (auth.uid(), 'invoice_template.docx', 'f1e2d3c4b5a6987654321098765432109876fedc', 1024000, 'completed', 'clean', 0, now() - interval '30 minutes', '{"engine": "ClamAV", "clean": true}'::jsonb);

-- Sample alert rules
INSERT INTO public.alert_rules (
  user_id, name, description, conditions, severity_threshold, notification_channels, is_active
) VALUES 
  (auth.uid(), 'Critical Security Events', 'Alert on any critical severity security events', '{"severity": "critical", "source_apps": ["safedoc", "safemail", "safelink"]}'::jsonb, 'critical', '{"email": ["admin@company.com"], "slack": ["#security-alerts"]}'::jsonb, true),
  (auth.uid(), 'Malware Detections', 'Alert on any malware detection across all systems', '{"threat_indicators": "malware", "affected_assets": "*"}'::jsonb, 'high', '{"email": ["admin@company.com"], "sms": ["+1-555-0123"]}'::jsonb, true);

-- Sample remote sessions and script executions
INSERT INTO public.remote_sessions (
  user_id, device_id, session_type, status, client_ip, session_token, connection_details
) VALUES 
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'WS-ADMIN-01' LIMIT 1), 'desktop', 'active', '192.168.1.50', 'session_' || gen_random_uuid()::text, '{"resolution": "1920x1080", "color_depth": 32}'::jsonb),
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'SRV-FILE-01' LIMIT 1), 'terminal', 'ended', '192.168.1.51', 'session_' || gen_random_uuid()::text, '{"shell": "powershell"}'::jsonb);

INSERT INTO public.script_executions (
  user_id, device_id, script_name, script_content, script_type, execution_status, output, exit_code, started_at, completed_at
) VALUES 
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'WS-ADMIN-01' LIMIT 1), 'System Info Check', 'Get-ComputerInfo | Select-Object WindowsProductName, TotalPhysicalMemory, CsProcessors', 'powershell', 'completed', 'WindowsProductName: Windows 11 Pro\nTotalPhysicalMemory: 17179869184\nCsProcessors: Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz', 0, now() - interval '30 minutes', now() - interval '29 minutes'),
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'SRV-FILE-01' LIMIT 1), 'Disk Space Check', 'Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace', 'powershell', 'completed', 'DeviceID: C:\nSize: 536870912000\nFreeSpace: 134217728000', 0, now() - interval '1 hour', now() - interval '59 minutes');