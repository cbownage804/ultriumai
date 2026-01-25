-- Grant enterprise access to brandon@ultriumai.com for all products
INSERT INTO public.user_product_access (user_id, product, access_level) 
VALUES 
  ('b8cfe427-6c70-456c-a793-2279f9ddae40', 'ai_studio', 'enterprise'),
  ('b8cfe427-6c70-456c-a793-2279f9ddae40', 'safesuite', 'enterprise'),
  ('b8cfe427-6c70-456c-a793-2279f9ddae40', 'vanguard', 'enterprise')
ON CONFLICT (user_id, product) DO UPDATE SET access_level = EXCLUDED.access_level;