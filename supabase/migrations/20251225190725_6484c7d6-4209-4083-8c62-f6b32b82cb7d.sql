-- Table for compliance scan jobs dispatched to agents
CREATE TABLE public.compliance_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  framework_type TEXT NOT NULL, -- 'cis_linux', 'cis_windows', 'nist_800_53', 'pci_dss', 'hipaa', 'soc2', 'iso27001'
  scan_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_checks INTEGER DEFAULT 0,
  passed_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  warning_checks INTEGER DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 0,
  scan_config JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for individual compliance check results
CREATE TABLE public.compliance_check_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.compliance_scan_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  check_id TEXT NOT NULL, -- e.g., 'CIS-1.1.1', 'NIST-AC-1'
  check_name TEXT NOT NULL,
  check_description TEXT,
  category TEXT, -- 'Access Control', 'Audit Logging', 'Network Security', etc.
  framework_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pass', 'fail', 'warning', 'not_applicable', 'manual'
  severity TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low', 'info'
  actual_value TEXT,
  expected_value TEXT,
  remediation_steps TEXT,
  evidence JSONB DEFAULT '{}',
  is_remediated BOOLEAN DEFAULT false,
  remediated_at TIMESTAMP WITH TIME ZONE,
  remediated_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for compliance benchmarks (pre-defined check templates)
CREATE TABLE public.compliance_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_type TEXT NOT NULL,
  check_id TEXT NOT NULL,
  check_name TEXT NOT NULL,
  check_description TEXT,
  category TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  os_type TEXT, -- 'linux', 'windows', 'macos', 'all'
  check_command TEXT, -- Command to run on agent
  expected_result TEXT,
  remediation_command TEXT,
  remediation_steps TEXT,
  is_automated BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(framework_type, check_id)
);

-- Table for scheduled compliance scans
CREATE TABLE public.compliance_scan_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_name TEXT NOT NULL,
  framework_types TEXT[] NOT NULL,
  agent_ids UUID[],
  scan_all_agents BOOLEAN DEFAULT false,
  schedule_cron TEXT, -- Cron expression
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  notification_emails TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_scan_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_scan_jobs
CREATE POLICY "Users can view their compliance scan jobs"
  ON public.compliance_scan_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create compliance scan jobs"
  ON public.compliance_scan_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their compliance scan jobs"
  ON public.compliance_scan_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for compliance_check_results
CREATE POLICY "Users can view their compliance check results"
  ON public.compliance_check_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create compliance check results"
  ON public.compliance_check_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their compliance check results"
  ON public.compliance_check_results FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for compliance_benchmarks (public read, no user writes)
CREATE POLICY "Anyone can view compliance benchmarks"
  ON public.compliance_benchmarks FOR SELECT
  USING (true);

-- RLS Policies for compliance_scan_schedules
CREATE POLICY "Users can view their compliance scan schedules"
  ON public.compliance_scan_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create compliance scan schedules"
  ON public.compliance_scan_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their compliance scan schedules"
  ON public.compliance_scan_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their compliance scan schedules"
  ON public.compliance_scan_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Insert CIS Linux benchmark checks
INSERT INTO public.compliance_benchmarks (framework_type, check_id, check_name, check_description, category, severity, os_type, check_command, expected_result, remediation_steps) VALUES
('cis_linux', 'CIS-1.1.1', 'Ensure mounting of cramfs is disabled', 'The cramfs filesystem type is a compressed read-only filesystem', 'Filesystem Configuration', 'low', 'linux', 'modprobe -n -v cramfs 2>&1 | grep -E "(install|not found)"', 'install /bin/true', 'Add "install cramfs /bin/true" to /etc/modprobe.d/cramfs.conf'),
('cis_linux', 'CIS-1.1.2', 'Ensure mounting of freevxfs is disabled', 'The freevxfs filesystem type is used for disk imaging', 'Filesystem Configuration', 'low', 'linux', 'modprobe -n -v freevxfs 2>&1 | grep -E "(install|not found)"', 'install /bin/true', 'Add "install freevxfs /bin/true" to /etc/modprobe.d/freevxfs.conf'),
('cis_linux', 'CIS-1.4.1', 'Ensure permissions on bootloader config are configured', 'Grub configuration should not be readable by non-root users', 'Secure Boot Settings', 'high', 'linux', 'stat -c "%a %u %g" /boot/grub*/grub.cfg 2>/dev/null', '600 0 0', 'Run: chmod og-rwx /boot/grub*/grub.cfg'),
('cis_linux', 'CIS-1.5.1', 'Ensure core dumps are restricted', 'A core dump is the memory of an executable program', 'Process Hardening', 'medium', 'linux', 'grep -E "^\s*\*\s+hard\s+core" /etc/security/limits.conf', '* hard core 0', 'Add "* hard core 0" to /etc/security/limits.conf'),
('cis_linux', 'CIS-2.2.1', 'Ensure X Window System is not installed', 'X Window System provides a GUI', 'Service Configuration', 'medium', 'linux', 'dpkg -l xserver-xorg* 2>/dev/null || rpm -qa xorg-x11* 2>/dev/null', '', 'Remove X Window packages: apt remove xserver-xorg*'),
('cis_linux', 'CIS-3.1.1', 'Ensure IP forwarding is disabled', 'IP forwarding allows the system to act as a router', 'Network Configuration', 'medium', 'linux', 'sysctl net.ipv4.ip_forward', 'net.ipv4.ip_forward = 0', 'Set net.ipv4.ip_forward = 0 in /etc/sysctl.conf'),
('cis_linux', 'CIS-3.2.1', 'Ensure source routed packets are not accepted', 'Source routed packets allow the source to specify the route', 'Network Configuration', 'medium', 'linux', 'sysctl net.ipv4.conf.all.accept_source_route', 'net.ipv4.conf.all.accept_source_route = 0', 'Set net.ipv4.conf.all.accept_source_route = 0 in /etc/sysctl.conf'),
('cis_linux', 'CIS-4.1.1', 'Ensure auditd is installed', 'auditd is the userspace component to the Linux Auditing System', 'Logging and Auditing', 'high', 'linux', 'dpkg -l auditd 2>/dev/null || rpm -q audit 2>/dev/null', 'installed', 'Install auditd: apt install auditd'),
('cis_linux', 'CIS-4.1.2', 'Ensure auditd service is enabled', 'Turn on the auditd daemon to record system events', 'Logging and Auditing', 'high', 'linux', 'systemctl is-enabled auditd 2>/dev/null', 'enabled', 'Enable auditd: systemctl enable auditd'),
('cis_linux', 'CIS-5.2.1', 'Ensure permissions on /etc/ssh/sshd_config are configured', 'SSH config should be protected', 'Access Control', 'high', 'linux', 'stat -c "%a %u %g" /etc/ssh/sshd_config', '600 0 0', 'Run: chmod 600 /etc/ssh/sshd_config'),
('cis_linux', 'CIS-5.2.2', 'Ensure SSH Protocol is set to 2', 'SSH Protocol 1 has known vulnerabilities', 'Access Control', 'critical', 'linux', 'grep "^Protocol" /etc/ssh/sshd_config', 'Protocol 2', 'Set Protocol 2 in /etc/ssh/sshd_config'),
('cis_linux', 'CIS-5.2.3', 'Ensure SSH root login is disabled', 'Direct root login should be disabled', 'Access Control', 'critical', 'linux', 'grep "^PermitRootLogin" /etc/ssh/sshd_config', 'PermitRootLogin no', 'Set PermitRootLogin no in /etc/ssh/sshd_config'),
('cis_linux', 'CIS-5.3.1', 'Ensure password creation requirements are configured', 'Strong password policies should be in place', 'Authentication', 'high', 'linux', 'grep -E "^minlen" /etc/security/pwquality.conf', 'minlen = 14', 'Set minlen = 14 in /etc/security/pwquality.conf'),
('cis_linux', 'CIS-5.4.1', 'Ensure password expiration is 365 days or less', 'Passwords should be changed regularly', 'Authentication', 'medium', 'linux', 'grep PASS_MAX_DAYS /etc/login.defs', 'PASS_MAX_DAYS 365', 'Set PASS_MAX_DAYS 365 in /etc/login.defs'),
('cis_linux', 'CIS-6.1.1', 'Ensure permissions on /etc/passwd are configured', '/etc/passwd contains user account information', 'System Maintenance', 'high', 'linux', 'stat -c "%a" /etc/passwd', '644', 'Run: chmod 644 /etc/passwd');

-- Insert CIS Windows benchmark checks
INSERT INTO public.compliance_benchmarks (framework_type, check_id, check_name, check_description, category, severity, os_type, check_command, expected_result, remediation_steps) VALUES
('cis_windows', 'CIS-1.1.1', 'Ensure Enforce password history is set to 24 or more', 'Prevents password reuse', 'Account Policies', 'high', 'windows', 'net accounts | findstr /C:"Length of password history"', '24', 'Set via Group Policy: Computer Configuration\\Windows Settings\\Security Settings\\Account Policies\\Password Policy'),
('cis_windows', 'CIS-1.1.2', 'Ensure Maximum password age is set to 60 or fewer days', 'Passwords should be changed regularly', 'Account Policies', 'medium', 'windows', 'net accounts | findstr /C:"Maximum password age"', '60', 'Set via Group Policy'),
('cis_windows', 'CIS-1.1.3', 'Ensure Minimum password length is set to 14 or more', 'Longer passwords are more secure', 'Account Policies', 'high', 'windows', 'net accounts | findstr /C:"Minimum password length"', '14', 'Set via Group Policy'),
('cis_windows', 'CIS-2.2.1', 'Ensure Windows Firewall is enabled', 'Firewall protects against network attacks', 'Firewall Configuration', 'critical', 'windows', 'netsh advfirewall show allprofiles state', 'ON', 'Enable via: netsh advfirewall set allprofiles state on'),
('cis_windows', 'CIS-2.3.1', 'Ensure Windows Defender is enabled', 'Antivirus protection', 'Endpoint Protection', 'critical', 'windows', 'Get-MpComputerStatus | Select-Object AntivirusEnabled', 'True', 'Enable Windows Defender via Settings'),
('cis_windows', 'CIS-5.1.1', 'Ensure Remote Desktop is disabled if not required', 'RDP should be disabled if not needed', 'Remote Access', 'high', 'windows', 'reg query "HKLM\\System\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections', '0x1', 'Disable RDP via System Properties'),
('cis_windows', 'CIS-9.1.1', 'Ensure Windows Update is enabled', 'Automatic updates patch vulnerabilities', 'Patch Management', 'critical', 'windows', 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update" /v AUOptions', '4', 'Enable via Windows Update settings'),
('cis_windows', 'CIS-18.1.1', 'Ensure BitLocker is enabled on OS drive', 'Full disk encryption protects data', 'Data Protection', 'high', 'windows', 'manage-bde -status C:', 'Protection On', 'Enable BitLocker via Control Panel');

-- Insert NIST 800-53 controls
INSERT INTO public.compliance_benchmarks (framework_type, check_id, check_name, check_description, category, severity, os_type, check_command, expected_result, remediation_steps) VALUES
('nist_800_53', 'AC-1', 'Access Control Policy and Procedures', 'Organization defines access control policy', 'Access Control', 'high', 'all', NULL, NULL, 'Document and implement access control policy'),
('nist_800_53', 'AC-2', 'Account Management', 'Organization manages information system accounts', 'Access Control', 'high', 'all', NULL, NULL, 'Implement account management procedures'),
('nist_800_53', 'AC-3', 'Access Enforcement', 'System enforces approved authorizations', 'Access Control', 'critical', 'all', NULL, NULL, 'Configure access enforcement mechanisms'),
('nist_800_53', 'AU-2', 'Audit Events', 'Organization determines auditable events', 'Audit and Accountability', 'high', 'all', NULL, NULL, 'Define and configure audit events'),
('nist_800_53', 'AU-3', 'Content of Audit Records', 'Audit records contain required information', 'Audit and Accountability', 'high', 'all', NULL, NULL, 'Configure audit record content'),
('nist_800_53', 'CM-2', 'Baseline Configuration', 'Organization develops baseline configurations', 'Configuration Management', 'high', 'all', NULL, NULL, 'Document baseline configurations'),
('nist_800_53', 'IA-2', 'Identification and Authentication', 'Users are uniquely identified and authenticated', 'Identification and Auth', 'critical', 'all', NULL, NULL, 'Implement user authentication'),
('nist_800_53', 'SC-7', 'Boundary Protection', 'System monitors communications at external boundary', 'System and Comms Protection', 'critical', 'all', NULL, NULL, 'Implement boundary protection'),
('nist_800_53', 'SI-2', 'Flaw Remediation', 'Organization identifies and corrects flaws', 'System and Info Integrity', 'high', 'all', NULL, NULL, 'Implement patch management');

-- Insert PCI-DSS controls
INSERT INTO public.compliance_benchmarks (framework_type, check_id, check_name, check_description, category, severity, os_type, check_command, expected_result, remediation_steps) VALUES
('pci_dss', 'PCI-1.1', 'Install and maintain a firewall configuration', 'Firewalls control network traffic', 'Build and Maintain Secure Network', 'critical', 'all', NULL, NULL, 'Implement firewall rules'),
('pci_dss', 'PCI-2.1', 'Change vendor-supplied defaults', 'Default passwords must be changed', 'Build and Maintain Secure Network', 'critical', 'all', NULL, NULL, 'Change all default credentials'),
('pci_dss', 'PCI-3.1', 'Protect stored cardholder data', 'Minimize data storage and retention', 'Protect Cardholder Data', 'critical', 'all', NULL, NULL, 'Implement data protection'),
('pci_dss', 'PCI-4.1', 'Use strong cryptography for transmission', 'Encrypt cardholder data in transit', 'Encrypt Transmission', 'critical', 'all', NULL, NULL, 'Enable TLS/SSL'),
('pci_dss', 'PCI-5.1', 'Protect all systems against malware', 'Deploy anti-virus software', 'Maintain Vulnerability Management', 'critical', 'all', NULL, NULL, 'Install and update anti-virus'),
('pci_dss', 'PCI-6.1', 'Establish a process for vulnerabilities', 'Identify security vulnerabilities', 'Maintain Vulnerability Management', 'high', 'all', NULL, NULL, 'Implement vulnerability scanning'),
('pci_dss', 'PCI-7.1', 'Limit access to system components', 'Restrict access based on need to know', 'Implement Strong Access Control', 'high', 'all', NULL, NULL, 'Implement access controls'),
('pci_dss', 'PCI-8.1', 'Identify and authenticate users', 'Assign unique ID to each user', 'Implement Strong Access Control', 'high', 'all', NULL, NULL, 'Implement user identification'),
('pci_dss', 'PCI-10.1', 'Track and monitor all access', 'Implement audit trails', 'Track and Monitor Access', 'high', 'all', NULL, NULL, 'Enable comprehensive logging'),
('pci_dss', 'PCI-11.1', 'Test security systems regularly', 'Regular security testing', 'Test Security Systems', 'high', 'all', NULL, NULL, 'Implement security testing program');

-- Create indexes
CREATE INDEX idx_compliance_scan_jobs_user_id ON public.compliance_scan_jobs(user_id);
CREATE INDEX idx_compliance_scan_jobs_agent_id ON public.compliance_scan_jobs(agent_id);
CREATE INDEX idx_compliance_scan_jobs_status ON public.compliance_scan_jobs(scan_status);
CREATE INDEX idx_compliance_check_results_job_id ON public.compliance_check_results(job_id);
CREATE INDEX idx_compliance_check_results_status ON public.compliance_check_results(status);
CREATE INDEX idx_compliance_benchmarks_framework ON public.compliance_benchmarks(framework_type);

-- Create trigger for updated_at
CREATE TRIGGER update_compliance_scan_jobs_updated_at
  BEFORE UPDATE ON public.compliance_scan_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_scan_schedules_updated_at
  BEFORE UPDATE ON public.compliance_scan_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();