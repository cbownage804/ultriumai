-- Increase credits limit for enterprise testing
UPDATE user_credits 
SET credits_limit = 999999 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'brandon.howard@kwccpa.com' LIMIT 1);