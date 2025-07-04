-- Fix Brandon's subscription to Enterprise
UPDATE subscribers 
SET 
  subscription_tier = 'enterprise',
  subscribed = true,
  subscription_end = NOW() + INTERVAL '1 month'
WHERE email = 'brandon.howard@kwccpa.com';