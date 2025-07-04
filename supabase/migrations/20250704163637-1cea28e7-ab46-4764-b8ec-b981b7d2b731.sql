-- Fix Brandon's enterprise subscription and credits
-- Update subscriber record to enterprise
UPDATE subscribers 
SET 
  subscription_tier = 'enterprise',
  subscribed = true,
  subscription_end = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE email = 'brandon.howard@kwccpa.com';

-- Update credits to enterprise level
UPDATE user_credits 
SET 
  credits_limit = 15000,
  credits_used = 0,
  updated_at = NOW()
WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';

-- Verify the updates (removed problematic UNION query with type mismatch)