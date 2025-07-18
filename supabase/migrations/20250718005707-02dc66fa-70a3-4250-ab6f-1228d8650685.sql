-- Insert a connector record for the agent key that's being used
INSERT INTO public.safenet_connectors (connector_key, connector_name, status, user_id) 
VALUES ('sk-safenet-b8cfe427-yhij47', 'Default SafeNet Connector', 'active', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (connector_key) DO UPDATE SET
  status = 'active',
  updated_at = now();