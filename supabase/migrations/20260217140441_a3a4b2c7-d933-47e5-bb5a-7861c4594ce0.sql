
-- Add 'basic' to the access_level check constraint
ALTER TABLE user_product_access DROP CONSTRAINT user_product_access_access_level_check;
ALTER TABLE user_product_access ADD CONSTRAINT user_product_access_access_level_check 
  CHECK (access_level = ANY (ARRAY['free'::text, 'basic'::text, 'pro'::text, 'business'::text, 'enterprise'::text]));

-- Provision credits for user with active Basic 100/mo subscription
INSERT INTO user_product_access (user_id, product, access_level, granted_at, expires_at, updated_at)
VALUES (
  '7b592a7f-16e4-46c2-870d-fa288ca31c31',
  'ai_studio',
  'basic',
  now(),
  '2026-03-17T14:01:00+00:00',
  now()
)
ON CONFLICT (user_id, product) 
DO UPDATE SET 
  access_level = 'basic',
  granted_at = now(),
  expires_at = '2026-03-17T14:01:00+00:00',
  updated_at = now();
