-- Update brandon.howard@kwccpa.com to enterprise tier for testing
UPDATE subscribers 
SET 
  subscription_tier = 'enterprise', 
  subscribed = true, 
  subscription_end = now() + interval '1 year',
  updated_at = now()
WHERE email = 'brandon.howard@kwccpa.com';