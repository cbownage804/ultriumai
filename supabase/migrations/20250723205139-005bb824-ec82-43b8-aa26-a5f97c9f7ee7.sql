-- Simplified seed data for RMM system testing

-- 1. Add test devices to safenet_devices (for device_commands to reference)
INSERT INTO public.safenet_devices (id, user_id, device_name, ip_address, hostname, connector_key, status, device_type)
VALUES
('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','WS-01','192.168.1.10','WS-01','ck-test-123','online','workstation'),
('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','SRV-01','192.168.1.20','SRV-01','ck-test-123','online','server'),  
('00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000001','LAPTOP-01','10.0.0.55','LAPTOP-01','ck-test-123','offline','laptop')
ON CONFLICT (id) DO NOTHING;

-- 2. Add test organization
INSERT INTO public.organizations (id, connector_key, client_code, client_name)
VALUES ('00000000-0000-0000-0000-000000000001','ck-test-123','TEST001','Test Org')
ON CONFLICT (connector_key) DO NOTHING;

-- 3. Add test commands with valid types and statuses
INSERT INTO public.device_commands (device_id, command_type, payload, status)
VALUES
('00000000-0000-0000-0000-000000000101','run_scan','{}','queued'),
('00000000-0000-0000-0000-000000000102','checkin_now','{}','in_progress'),
('00000000-0000-0000-0000-000000000103','restart_service','{}','done');