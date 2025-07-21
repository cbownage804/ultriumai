
-- Create device record for the test agent
INSERT INTO public.safenet_devices (
    user_id,
    connector_key,
    ip_address,
    hostname,
    device_name,
    device_type,
    status,
    is_managed,
    network_segment,
    discovery_method,
    last_seen_at,
    created_at,
    updated_at
) VALUES (
    (SELECT user_id FROM public.safenet_connectors WHERE connector_key = 'test_connector_123' LIMIT 1),
    'test_connector_123',
    '192.168.1.40',
    'R15',
    'Test Desktop - R15',
    'workstation',
    'offline',
    false,
    'local',
    ARRAY['agent_checkin'],
    now(),
    now(),
    now()
) ON CONFLICT (ip_address, user_id) DO UPDATE SET
    hostname = EXCLUDED.hostname,
    device_name = EXCLUDED.device_name,
    connector_key = EXCLUDED.connector_key,
    updated_at = now();
