-- Update subscription status for UltriumAI employees
UPDATE subscribers 
SET subscribed = true, subscription_tier = 'enterprise'
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@ultriumai.com' 
  OR email LIKE '%@ultriumllc.com'
);