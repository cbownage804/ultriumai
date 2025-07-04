-- Fix Brandon's enterprise subscription status (final fix)
UPDATE subscribers 
SET 
  subscription_tier = 'enterprise',
  subscribed = true,
  subscription_end = NOW() + INTERVAL '2 years',
  updated_at = NOW()
WHERE email = 'brandon.howard@kwccpa.com';

-- Verify the update
SELECT email, subscription_tier, subscribed, subscription_end 
FROM subscribers 
WHERE email = 'brandon.howard@kwccpa.com';