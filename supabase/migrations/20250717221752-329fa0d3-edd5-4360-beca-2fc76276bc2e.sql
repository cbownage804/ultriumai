-- Insert the missing connector record for the downloaded connector
INSERT INTO safenet_connectors (
  user_id,
  connector_key,
  connector_name,
  platform,
  status,
  created_at,
  updated_at
) VALUES (
  (SELECT auth.uid()),  -- Use the current user's ID
  'sk-safenet-b8cfe427-5kh4rt',
  'SafeNet Connector 5kh4rt',
  'python',
  'active',
  now(),
  now()
)
ON CONFLICT (user_id, connector_key) DO NOTHING;