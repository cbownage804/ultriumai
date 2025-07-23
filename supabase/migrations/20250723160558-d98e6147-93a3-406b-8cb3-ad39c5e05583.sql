-- Seed realistic test data for RMM system

-- 1 org
INSERT INTO public.organizations (id, connector_key, client_code, client_name)
VALUES ('00000000-0000-0000-0000-000000000001','ck-test-123','TEST001','Test Org')
ON CONFLICT (connector_key) DO NOTHING;

-- 3 devices under that org
INSERT INTO public.devices (id, org_id, hostname, ip_address, domain, agent_version, status, last_checkin)
VALUES
('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','WS-01','192.168.1.10','TEST.LOCAL','1.0.1','online', now()),
('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','SRV-01','192.168.1.20','TEST.LOCAL','1.0.1','stale',  now() - interval '1 day'),
('00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000001','LAPTOP-01','10.0.0.55','WORKGROUP','1.0.1','offline', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- 2 scans for WS-01
INSERT INTO public.device_scans (device_id, scan_type, devices_found, scan_duration, results)
VALUES
('00000000-0000-0000-0000-000000000101','basic_discovery',12,45,'{"discovered":12}'),
('00000000-0000-0000-0000-000000000101','basic_discovery',9,38,'{"discovered":9}');

-- 3 queued commands (1 per valid status: queued, running, done)
INSERT INTO public.device_commands (device_id, type, payload, status)
VALUES
('00000000-0000-0000-0000-000000000101','run_scan','{}','queued'),
('00000000-0000-0000-0000-000000000102','checkin_now','{}','running'),
('00000000-0000-0000-0000-000000000103','restart_service','{}','done');