-- Create table for scheduled penetration tests (like Vonahi's recurring scans)
CREATE TABLE public.pentest_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE,
  schedule_name TEXT NOT NULL,
  target TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  scan_options JSONB DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'weekly',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notification_emails TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for remediation playbooks
CREATE TABLE public.pentest_remediation_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vulnerability_type TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  remediation_steps JSONB NOT NULL DEFAULT '[]',
  verification_steps JSONB DEFAULT '[]',
  reference_links JSONB DEFAULT '[]',
  compliance_frameworks JSONB DEFAULT '{}',
  estimated_fix_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for pentest reports
CREATE TABLE public.pentest_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL,
  command_id UUID,
  report_name TEXT NOT NULL,
  target TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  executive_summary TEXT,
  findings_summary JSONB DEFAULT '{}',
  detailed_findings JSONB DEFAULT '[]',
  attack_paths JSONB DEFAULT '[]',
  compliance_mapping JSONB DEFAULT '{}',
  remediation_priority JSONB DEFAULT '[]',
  risk_score DECIMAL(5,2),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_status TEXT DEFAULT 'draft'
);

-- Enable RLS
ALTER TABLE public.pentest_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pentest_remediation_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pentest_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own schedules" ON public.pentest_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view playbooks" ON public.pentest_remediation_playbooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own reports" ON public.pentest_reports FOR ALL USING (auth.uid() = user_id);

-- Insert remediation playbooks
INSERT INTO public.pentest_remediation_playbooks (vulnerability_type, title, severity, description, impact, remediation_steps, verification_steps, reference_links, compliance_frameworks, estimated_fix_time) VALUES
('ssl_weak_cipher', 'Weak SSL/TLS Cipher Suites', 'medium', 'The server supports weak cipher suites that could allow attackers to decrypt communications.', 'Sensitive data transmitted over HTTPS could be intercepted and decrypted.', 
 '[{"step": 1, "action": "Audit current cipher configuration"}, {"step": 2, "action": "Disable weak ciphers (DES, 3DES, RC4)"}, {"step": 3, "action": "Enable TLS 1.2+ with AES-GCM"}, {"step": 4, "action": "Test with SSL Labs"}]',
 '[{"check": "SSL Labs scan", "expected": "Grade A or higher"}]',
 '[{"title": "Mozilla SSL Config Generator", "url": "https://ssl-config.mozilla.org/"}]',
 '{"PCI-DSS": ["2.2.3", "4.1"], "NIST": ["SC-8", "SC-13"], "HIPAA": ["164.312(e)(1)"]}', '1-2 hours'),

('smb_signing_disabled', 'SMB Signing Not Required', 'high', 'SMB signing is not required, making it vulnerable to MITM attacks.', 'Attackers can intercept and modify SMB traffic.',
 '[{"step": 1, "action": "Open Group Policy Editor"}, {"step": 2, "action": "Enable SMB signing requirement"}, {"step": 3, "action": "Deploy policy with gpupdate /force"}]',
 '[{"check": "Verify SMB signing status", "expected": "Required on all systems"}]',
 '[{"title": "Microsoft SMB Signing", "url": "https://docs.microsoft.com/en-us/troubleshoot/windows-server/networking/overview-server-message-block-signing"}]',
 '{"PCI-DSS": ["2.2.2", "4.1"], "NIST": ["SC-8", "SC-23"], "CIS": ["9.2.1"]}', '30 minutes'),

('default_credentials', 'Default Credentials Detected', 'critical', 'Service accessible using default credentials.', 'Full unauthorized system access.',
 '[{"step": 1, "action": "Change all default passwords immediately"}, {"step": 2, "action": "Implement strong password policy"}, {"step": 3, "action": "Enable MFA where possible"}]',
 '[{"check": "Attempt login with old credentials", "expected": "Access denied"}]',
 '[{"title": "NIST Password Guidelines", "url": "https://pages.nist.gov/800-63-3/sp800-63b.html"}]',
 '{"PCI-DSS": ["2.1", "8.2"], "NIST": ["IA-5"], "HIPAA": ["164.312(d)"], "CIS": ["5.2"]}', '15-30 minutes'),

('eternalblue', 'MS17-010 EternalBlue Vulnerability', 'critical', 'System vulnerable to EternalBlue exploit (CVE-2017-0144).', 'Remote code execution - complete system compromise. Used by WannaCry ransomware.',
 '[{"step": 1, "action": "Install MS17-010 security patch"}, {"step": 2, "action": "Disable SMBv1"}, {"step": 3, "action": "Block ports 445/139 at perimeter"}]',
 '[{"check": "Verify KB4012212 installed", "expected": "Patch present"}, {"check": "Confirm SMBv1 disabled", "expected": "EnableSMB1Protocol: False"}]',
 '[{"title": "MS17-010 Bulletin", "url": "https://docs.microsoft.com/en-us/security-updates/securitybulletins/2017/ms17-010"}]',
 '{"PCI-DSS": ["6.2", "11.2"], "NIST": ["SI-2", "RA-5"], "HIPAA": ["164.308(a)(5)(ii)(B)"]}', '1 hour'),

('rdp_nla_disabled', 'RDP NLA Disabled', 'high', 'RDP does not require Network Level Authentication.', 'Attackers can reach login screen, enabling brute force and RDP exploits.',
 '[{"step": 1, "action": "Enable NLA in System Properties"}, {"step": 2, "action": "Apply via Group Policy"}, {"step": 3, "action": "Require TLS encryption"}]',
 '[{"check": "Test unauthenticated connection", "expected": "Connection refused before login"}]',
 '[{"title": "Microsoft NLA Documentation", "url": "https://docs.microsoft.com/en-us/windows-server/remote/remote-desktop-services/clients/remote-desktop-allow-access"}]',
 '{"PCI-DSS": ["2.2.2", "8.3"], "NIST": ["AC-17", "IA-2"], "CIS": ["18.9.59.3.9.1"]}', '15-30 minutes'),

('open_ftp_anonymous', 'Anonymous FTP Access', 'high', 'FTP allows anonymous access.', 'Unauthenticated file access and potential upload of malicious files.',
 '[{"step": 1, "action": "Disable anonymous access"}, {"step": 2, "action": "Implement user authentication"}, {"step": 3, "action": "Consider migrating to SFTP"}]',
 '[{"check": "Attempt anonymous login", "expected": "Login rejected"}]',
 '[{"title": "OWASP FTP Testing", "url": "https://owasp.org/www-project-web-security-testing-guide/"}]',
 '{"PCI-DSS": ["7.1", "8.1"], "NIST": ["AC-3", "IA-2"], "HIPAA": ["164.312(d)"]}', '15-30 minutes'),

('bluekeep', 'CVE-2019-0708 BlueKeep Vulnerability', 'critical', 'RDP vulnerable to BlueKeep remote code execution.', 'Wormable RCE - can spread across networks automatically.',
 '[{"step": 1, "action": "Install KB4499175 or later"}, {"step": 2, "action": "Enable NLA"}, {"step": 3, "action": "Block RDP at network perimeter if not needed"}]',
 '[{"check": "Verify patch installed", "expected": "KB4499175 present"}, {"check": "Rescan for BlueKeep", "expected": "Not detected"}]',
 '[{"title": "Microsoft BlueKeep Advisory", "url": "https://portal.msrc.microsoft.com/en-US/security-guidance/advisory/CVE-2019-0708"}]',
 '{"PCI-DSS": ["6.2"], "NIST": ["SI-2"], "CIS": ["3.4"]}', '30 minutes'),

('ssl_expired_cert', 'Expired SSL Certificate', 'medium', 'SSL certificate has expired.', 'Users see security warnings, potential MITM if ignored.',
 '[{"step": 1, "action": "Generate new CSR"}, {"step": 2, "action": "Obtain new certificate from CA"}, {"step": 3, "action": "Install and configure new certificate"}]',
 '[{"check": "Verify certificate validity", "expected": "Valid and not expired"}]',
 '[{"title": "Let''s Encrypt", "url": "https://letsencrypt.org/"}]',
 '{"PCI-DSS": ["4.1"], "NIST": ["SC-17"]}', '30 minutes - 2 hours');

-- Triggers
CREATE TRIGGER update_pentest_schedules_updated_at BEFORE UPDATE ON public.pentest_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pentest_reports_updated_at BEFORE UPDATE ON public.pentest_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();