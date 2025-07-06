-- Add basic demo data (simplified)

-- Insert demo SafePass vaults and entries
INSERT INTO safepass_vaults (user_id, vault_name, description, encryption_key_hash, is_shared) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Personal Vault', 'Personal passwords and credentials', 'demo_hash_personal_001', false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Work Vault', 'Corporate accounts and systems', 'demo_hash_work_002', false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'Shared Team Vault', 'Shared team credentials', 'demo_hash_shared_003', true);

-- Insert demo SafePass entries
INSERT INTO safepass_entries (user_id, vault_id, title, entry_type, encrypted_data, url, notes, is_favorite, password_strength_score, is_compromised) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Personal Vault' LIMIT 1), 'Gmail Account', 'login', '{"username":"demo_encrypted_user","password":"demo_encrypted_pass"}', 'https://gmail.com', 'Personal email account', true, 85, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Personal Vault' LIMIT 1), 'Banking - Chase', 'login', '{"username":"demo_encrypted_bank","password":"demo_encrypted_strong"}', 'https://chase.com', 'Primary checking account', true, 92, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Work Vault' LIMIT 1), 'Office 365', 'login', '{"username":"demo_work_user","password":"demo_work_pass"}', 'https://office.com', 'Corporate email and documents', true, 78, false),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', (SELECT id FROM safepass_vaults WHERE vault_name = 'Work Vault' LIMIT 1), 'Old LinkedIn', 'login', '{"username":"demo_linkedin","password":"123456"}', 'https://linkedin.com', 'Professional networking - needs update', false, 35, true);

-- Insert demo Security Center incidents and events
INSERT INTO security_events (user_id, event_type, severity, title, description, source_system, affected_assets, detection_rules, raw_data, status) VALUES
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'brute_force_attack', 'high', 'SSH Brute Force Attack Detected', 'Multiple failed SSH login attempts from external IP', 'SafeNet Monitor', ARRAY['web-prod-01'], ARRAY['failed_login_threshold'], '{"source_ip": "203.0.113.45", "attempts": 25, "duration": "5 minutes"}', 'investigating'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'malware_detected', 'critical', 'Malware Detected in Email', 'Malicious attachment intercepted by SafeMail', 'SafeMail Scanner', ARRAY['email-system'], ARRAY['malware_signature'], '{"filename": "invoice.exe", "hash": "abc123", "threat": "Trojan.Win32.Agent"}', 'contained'),
('453c6d29-34db-4b1a-9f29-3ff7170ae765', 'unauthorized_access', 'medium', 'Unusual Login Location', 'User login from unusual geographic location', 'SafePass Monitor', ARRAY['user-accounts'], ARRAY['geo_location_anomaly'], '{"user": "john.doe", "location": "Romania", "usual_location": "USA"}', 'monitoring');

-- Update timestamps to create realistic timeline
UPDATE safepass_entries SET last_used_at = now() - interval '2 days' WHERE title = 'Gmail Account';
UPDATE safepass_entries SET last_used_at = now() - interval '1 day' WHERE title = 'Office 365';