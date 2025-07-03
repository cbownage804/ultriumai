-- Update the current user's subscription to enterprise tier for testing
-- First, let's see what's in the subscribers table
SELECT * FROM subscribers LIMIT 5;

-- You can run this query to update your account to enterprise:
-- UPDATE subscribers 
-- SET subscription_tier = 'enterprise', subscribed = true, subscription_end = now() + interval '1 year'
-- WHERE email = 'your-email@example.com';

-- Replace 'your-email@example.com' with your actual email address
-- This will give you enterprise access for testing purposes