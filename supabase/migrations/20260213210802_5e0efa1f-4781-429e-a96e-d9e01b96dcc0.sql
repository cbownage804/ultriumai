
-- Grant brandon@ultriumllc.com enterprise access to all products
INSERT INTO public.user_product_access (user_id, product, access_level)
VALUES 
  ('0e442d7d-9588-4b97-bdfb-c7bc28ab1de4', 'vanguard', 'enterprise'),
  ('0e442d7d-9588-4b97-bdfb-c7bc28ab1de4', 'safesuite', 'enterprise'),
  ('0e442d7d-9588-4b97-bdfb-c7bc28ab1de4', 'ai_studio', 'enterprise')
ON CONFLICT (user_id, product) DO UPDATE SET access_level = 'enterprise';
