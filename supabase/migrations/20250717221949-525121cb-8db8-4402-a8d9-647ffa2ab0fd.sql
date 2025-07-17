-- Insert the missing connector record
INSERT INTO safenet_connectors (
  user_id,
  connector_key,
  connector_name,
  client_name,
  status,
  created_at,
  updated_at
) VALUES (
  '453c6d29-34db-4b1a-9f29-3ff7170ae765',
  'sk-safenet-b8cfe427-5kh4rt',
  'SafeNet Connector 5kh4rt',
  'Default Client',
  'active',
  now(),
  now()
);