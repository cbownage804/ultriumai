-- Create a test SafeNet connector for demonstration
INSERT INTO public.safenet_connectors (
    id,
    connector_key,
    connector_name,
    user_id,
    status,
    connector_type,
    last_heartbeat,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'sk-safenet-b8cfe427-ki4d01',
    'Demo Connector - LenovoT15',
    (SELECT id FROM auth.users LIMIT 1), -- Use first available user
    'active',
    'basic',
    now(),
    now(),
    now()
)
ON CONFLICT (connector_key) DO UPDATE SET
    status = 'active',
    last_heartbeat = now(),
    updated_at = now();