-- Seed realistic test data for RMM system

-- First insert test devices into safenet_devices (since device_commands references this table)
INSERT INTO public.safenet_devices (id, user_id, device_name, ip_address, hostname, connector_key, status, device_type)
VALUES
('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','WS-01','192.168.1.10','WS-01','ck-test-123','online','workstation'),
('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','SRV-01','192.168.1.20','SRV-01','ck-test-123','online','server'),  
('00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000001','LAPTOP-01','10.0.0.55','LAPTOP-01','ck-test-123','offline','laptop')
ON CONFLICT (id) DO NOTHING;

-- 1 org (if organizations table exists)
INSERT INTO public.organizations (id, connector_key, client_code, client_name)
VALUES ('00000000-0000-0000-0000-000000000001','ck-test-123','TEST001','Test Org')
ON CONFLICT (connector_key) DO NOTHING;

-- 2 scans for WS-01 (if this references safenet_devices)
INSERT INTO public.device_scans (device_id, scan_type, devices_found, scan_duration, results)
VALUES
('00000000-0000-0000-0000-000000000101','basic_discovery',12,45,'{"discovered":12}'),
('00000000-0000-0000-0000-000000000101','basic_discovery',9,38,'{"discovered":9}');

-- 3 commands with valid statuses and command types
INSERT INTO public.device_commands (device_id, command_type, payload, status)
VALUES
('00000000-0000-0000-0000-000000000101','run_scan','{}','queued'),
('00000000-0000-0000-0000-000000000102','checkin_now','{}','in_progress'),
('00000000-0000-0000-0000-000000000103','restart_service','{}','done');