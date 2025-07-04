-- Upgrade brandon.howard@kwccpa.com to enterprise for testing
UPDATE subscribers 
SET 
  subscription_tier = 'enterprise',
  subscribed = true,
  subscription_end = NOW() + INTERVAL '1 month'
WHERE email = 'brandon.howard@kwccpa.com';

-- Also ensure user has unlimited credits for testing
INSERT INTO user_credits (user_id, credits_limit, credits_used)
SELECT 
  (SELECT auth.uid() FROM auth.users WHERE email = 'brandon.howard@kwccpa.com' LIMIT 1),
  999999,
  0
ON CONFLICT (user_id) 
DO UPDATE SET 
  credits_limit = 999999,
  credits_used = 0;