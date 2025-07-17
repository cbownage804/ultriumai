-- Insert the missing connector record for the downloaded connector (without platform column)
INSERT INTO safenet_connectors (
  user_id,
  connector_key,
  connector_name,
  client_name,
  status,
  created_at,
  updated_at
) 
SELECT 
  auth.uid() as user_id,
  'sk-safenet-b8cfe427-5kh4rt' as connector_key,
  'SafeNet Connector 5kh4rt' as connector_name,
  'Default Client' as client_name,
  'active' as status,
  now() as created_at,
  now() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM safenet_connectors 
  WHERE connector_key = 'sk-safenet-b8cfe427-5kh4rt'
);