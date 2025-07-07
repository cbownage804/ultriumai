-- Insert sample RMM customers
INSERT INTO rmm_customers (
  company_name, 
  primary_contact_name, 
  primary_contact_email, 
  phone,
  address,
  city,
  state,
  zip_code,
  is_active
) VALUES 
('Acme Corporation', 'John Smith', 'john@acme.com', '555-0101', '123 Business St', 'New York', 'NY', '10001', true),
('TechStart LLC', 'Sarah Johnson', 'sarah@techstart.com', '555-0102', '456 Innovation Ave', 'San Francisco', 'CA', '94105', true),
('Global Enterprises', 'Mike Wilson', 'mike@global.com', '555-0103', '789 Corporate Blvd', 'Chicago', 'IL', '60601', true);

-- Insert sample RMM devices with realistic data
INSERT INTO rmm_devices (
  customer_id,
  hostname,
  ip_address,
  device_type,
  status,
  cpu_usage,
  memory_usage,
  disk_usage,
  agent_version,
  last_logged_user,
  os_info
) 
SELECT 
  c.id,
  'DC-PRIMARY-' || c.company_name,
  '192.168.1.10',
  'server',
  'online',
  45,
  78,
  65,
  '2.1.0',
  'Administrator',
  'Windows Server 2022'
FROM rmm_customers c WHERE c.company_name = 'Acme Corporation'
UNION ALL
SELECT 
  c.id,
  'EXCHANGE-01-' || c.company_name,
  '192.168.1.15', 
  'server',
  'online',
  62,
  84,
  72,
  '2.1.0',
  'SYSTEM',
  'Windows Server 2019'
FROM rmm_customers c WHERE c.company_name = 'Acme Corporation'
UNION ALL
SELECT 
  c.id,
  'FILE-SERVER-' || c.company_name,
  '192.168.1.20',
  'server', 
  'online',
  89,
  91,
  88,
  '2.1.0',
  'fileadmin',
  'Windows Server 2022'
FROM rmm_customers c WHERE c.company_name = 'Acme Corporation'
UNION ALL
SELECT 
  c.id,
  'SALES-PC-01',
  '192.168.2.15',
  'workstation',
  'online',
  35,
  62,
  45,
  '2.1.0',
  'john.smith',
  'Windows 11 Pro'
FROM rmm_customers c WHERE c.company_name = 'TechStart LLC'
UNION ALL
SELECT 
  c.id,
  'MARKETING-WS-03',
  '192.168.2.28',
  'workstation',
  'online',
  42,
  58,
  67,
  '2.1.0',
  'jane.doe',
  'Windows 11 Pro'
FROM rmm_customers c WHERE c.company_name = 'TechStart LLC'
UNION ALL
SELECT 
  c.id,
  'IT-ADMIN-PC',
  '192.168.2.10',
  'workstation',
  'online',
  28,
  45,
  34,
  '2.1.0',
  'admin.user',
  'Windows 11 Pro'
FROM rmm_customers c WHERE c.company_name = 'Global Enterprises'
UNION ALL
SELECT 
  c.id,
  'ROUTER-MAIN',
  '192.168.1.1',
  'network_device',
  'online',
  15,
  32,
  12,
  NULL,
  NULL,
  'Cisco IOS 15.1'
FROM rmm_customers c WHERE c.company_name = 'Acme Corporation'
UNION ALL
SELECT 
  c.id,
  'EXEC-LAPTOP-01',
  '192.168.2.5',
  'workstation',
  'offline',
  78,
  89,
  23,
  '2.0.9',
  'ceo.smith',
  'Windows 11 Pro'
FROM rmm_customers c WHERE c.company_name = 'Global Enterprises';

-- Insert sample helpdesk tickets
INSERT INTO helpdesk_tickets (
  customer_id,
  title,
  description,
  priority,
  status,
  category
)
SELECT
  c.id,
  'Server Performance Issue',
  'FILE-SERVER showing high CPU and memory usage, needs investigation',
  'high',
  'open',
  'performance'
FROM rmm_customers c WHERE c.company_name = 'Acme Corporation'
UNION ALL
SELECT
  c.id,
  'Workstation Not Connecting to Domain',
  'SALES-PC-01 unable to authenticate with domain controller',
  'medium',
  'in_progress', 
  'connectivity'
FROM rmm_customers c WHERE c.company_name = 'TechStart LLC'
UNION ALL
SELECT
  c.id,
  'Laptop Offline for Extended Period',
  'EXEC-LAPTOP-01 has been offline for over 2 weeks, needs attention',
  'low',
  'open',
  'hardware'
FROM rmm_customers c WHERE c.company_name = 'Global Enterprises';