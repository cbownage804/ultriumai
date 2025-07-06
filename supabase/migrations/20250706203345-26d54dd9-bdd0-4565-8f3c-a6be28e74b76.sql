-- Add demo data for SafePass, SafeMail, SafeNet, and Security Center (Fixed)

-- Insert demo SafePass vaults and entries
INSERT INTO safepass_vaults (user_id, vault_name, description, encryption_key_hash, is_shared) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Personal Vault', 'Personal passwords and credentials', 'demo_hash_personal_001', false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Work Vault', 'Corporate accounts and systems', 'demo_hash_work_002', false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Shared Team Vault', 'Shared team credentials', 'demo_hash_shared_003', true);

-- Insert demo SafePass entries (with user_id)
INSERT INTO safepass_entries (user_id, vault_id, title, entry_type, url, notes, is_favorite, password_strength_score, is_compromised) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Personal Vault' LIMIT 1), 'Gmail Account', 'login', 'https://gmail.com', 'Personal email account', true, 85, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Personal Vault' LIMIT 1), 'Banking - Chase', 'banking', 'https://chase.com', 'Primary checking account', true, 92, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Personal Vault' LIMIT 1), 'Netflix', 'streaming', 'https://netflix.com', 'Entertainment subscription', false, 65, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Work Vault' LIMIT 1), 'Office 365', 'work', 'https://office.com', 'Corporate email and documents', true, 78, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Work Vault' LIMIT 1), 'AWS Console', 'cloud', 'https://aws.amazon.com', 'Cloud infrastructure management', true, 88, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Work Vault' LIMIT 1), 'Old LinkedIn', 'social', 'https://linkedin.com', 'Professional networking - needs update', false, 35, true),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Shared Team Vault' LIMIT 1), 'Team Slack', 'communication', 'https://slack.com', 'Team communication platform', false, 72, false);

-- Insert demo SafeMail threats and scans
INSERT INTO safemail_threats (user_id, email_address, threat_type, threat_level, subject_line, sender_address, detected_at, status, details) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brandon.howard@kwccpa.com', 'phishing', 'high', 'Urgent: Verify Your Account Now!', 'no-reply@fake-bank.com', now() - interval '2 hours', 'blocked', 'Suspicious sender attempting to steal credentials'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brandon.howard@kwccpa.com', 'malware', 'critical', 'Invoice #12345 - Please Review', 'accounting@suspiciousdomain.net', now() - interval '1 day', 'quarantined', 'Malicious attachment detected: invoice.exe'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brandon.howard@kwccpa.com', 'spam', 'low', 'Amazing Deal - 90% Off Everything!', 'deals@spammerstore.biz', now() - interval '3 hours', 'filtered', 'Commercial spam with suspicious links'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brandon.howard@kwccpa.com', 'spoofing', 'medium', 'Re: Meeting Tomorrow', 'ceo@company-typo.com', now() - interval '6 hours', 'flagged', 'Domain spoofing attempt detected'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brandon.howard@kwccpa.com', 'phishing', 'high', 'Microsoft Account Suspended', 'security@micr0soft.com', now() - interval '12 hours', 'blocked', 'Fake Microsoft security alert');

-- Insert demo SafeNet vulnerabilities and network assets
INSERT INTO safenet_assets (user_id, asset_name, asset_type, ip_address, hostname, os_type, os_version, status, last_scan_at, vulnerability_count, critical_vulns, high_vulns, medium_vulns, low_vulns) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Web Server - Production', 'server', '192.168.1.10', 'web-prod-01', 'Ubuntu', '20.04 LTS', 'online', now() - interval '1 hour', 5, 1, 2, 2, 0),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Database Server', 'database', '192.168.1.20', 'db-prod-01', 'CentOS', '8.4', 'online', now() - interval '2 hours', 8, 2, 3, 2, 1),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Firewall - Main', 'firewall', '192.168.1.1', 'fw-main-01', 'pfSense', '2.6.0', 'online', now() - interval '30 minutes', 2, 0, 0, 2, 0),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Workstation - CEO', 'workstation', '192.168.1.100', 'ceo-laptop', 'Windows', '11 Pro', 'online', now() - interval '4 hours', 12, 0, 4, 6, 2),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Legacy File Server', 'server', '192.168.1.50', 'file-legacy-01', 'Windows Server', '2016', 'offline', now() - interval '1 day', 25, 8, 10, 5, 2);

INSERT INTO safenet_vulnerabilities (user_id, asset_id, cve_id, title, description, severity, cvss_score, status, detected_at, patch_available, patch_complexity) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safenet_assets WHERE hostname = 'web-prod-01' LIMIT 1), 'CVE-2023-1234', 'Apache HTTP Server Buffer Overflow', 'Critical buffer overflow vulnerability in Apache HTTP Server', 'critical', 9.8, 'open', now() - interval '2 days', true, 'medium'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safenet_assets WHERE hostname = 'web-prod-01' LIMIT 1), 'CVE-2023-5678', 'SSL/TLS Configuration Issue', 'Weak SSL/TLS configuration allows downgrade attacks', 'high', 7.4, 'open', now() - interval '1 week', true, 'low'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safenet_assets WHERE hostname = 'db-prod-01' LIMIT 1), 'CVE-2023-9012', 'MySQL Privilege Escalation', 'Local privilege escalation in MySQL server', 'critical', 8.8, 'patching_scheduled', now() - interval '3 days', true, 'high'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safenet_assets WHERE hostname = 'db-prod-01' LIMIT 1), 'CVE-2023-3456', 'Database Access Control Bypass', 'Authentication bypass vulnerability', 'high', 8.1, 'open', now() - interval '5 days', true, 'medium'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safenet_assets WHERE hostname = 'ceo-laptop' LIMIT 1), 'CVE-2023-7890', 'Windows Kernel Elevation', 'Local privilege escalation through Windows kernel', 'high', 7.8, 'patched', now() - interval '1 week', true, 'low'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safenet_assets WHERE hostname = 'file-legacy-01' LIMIT 1), 'CVE-2019-1234', 'SMB Remote Code Execution', 'Critical RCE vulnerability in SMB protocol', 'critical', 10.0, 'open', now() - interval '2 weeks', true, 'high');

-- Insert demo Security Center incidents and events
INSERT INTO security_events (user_id, event_type, severity, title, description, source_system, affected_assets, detection_rules, raw_data, status) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brute_force_attack', 'high', 'SSH Brute Force Attack Detected', 'Multiple failed SSH login attempts from external IP', 'SafeNet Monitor', ARRAY['web-prod-01'], ARRAY['failed_login_threshold'], '{"source_ip": "203.0.113.45", "attempts": 25, "duration": "5 minutes"}', 'investigating'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'malware_detected', 'critical', 'Malware Detected in Email', 'Malicious attachment intercepted by SafeMail', 'SafeMail Scanner', ARRAY['email-system'], ARRAY['malware_signature'], '{"filename": "invoice.exe", "hash": "abc123", "threat": "Trojan.Win32.Agent"}', 'contained'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'unauthorized_access', 'medium', 'Unusual Login Location', 'User login from unusual geographic location', 'SafePass Monitor', ARRAY['user-accounts'], ARRAY['geo_location_anomaly'], '{"user": "john.doe", "location": "Romania", "usual_location": "USA"}', 'monitoring'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'vulnerability_exploit', 'critical', 'CVE-2023-1234 Exploitation Attempt', 'Active exploitation attempt against known vulnerability', 'SafeNet IDS', ARRAY['web-prod-01'], ARRAY['cve_exploit_signature'], '{"cve": "CVE-2023-1234", "attack_vector": "HTTP", "blocked": true}', 'resolved'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'data_exfiltration', 'high', 'Suspicious Data Transfer', 'Large volume of data transferred to external server', 'Network Monitor', ARRAY['db-prod-01'], ARRAY['data_transfer_anomaly'], '{"bytes_transferred": 5368709120, "destination": "external-server.com"}', 'investigating');

-- Update timestamps to create realistic timeline
UPDATE safepass_entries SET last_used_at = now() - interval '2 days' WHERE title = 'Gmail Account';
UPDATE safepass_entries SET last_used_at = now() - interval '1 day' WHERE title = 'Office 365';
UPDATE safepass_entries SET last_used_at = now() - interval '1 week' WHERE title = 'Banking - Chase';

-- Add some resolved incidents
INSERT INTO incidents (user_id, title, description, priority, severity, status, category, resolved_at, source_event_id) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Resolved: Email Malware Incident', 'Malicious email attachment was successfully quarantined and threat neutralized', 'high', 'high', 'resolved', 'Email Security', now() - interval '1 day', (SELECT id FROM security_events WHERE title = 'Malware Detected in Email' LIMIT 1)),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Patched: Web Server Vulnerability', 'CVE-2023-1234 has been successfully patched on web server', 'critical', 'critical', 'resolved', 'Vulnerability Management', now() - interval '2 hours', (SELECT id FROM security_events WHERE title = 'CVE-2023-1234 Exploitation Attempt' LIMIT 1));