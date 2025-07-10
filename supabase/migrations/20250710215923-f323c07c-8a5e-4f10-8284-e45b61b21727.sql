-- Update brandon@ultriumai.com to have enterprise subscription status
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'enterprise',
  subscription_end = null,
  updated_at = now()
WHERE email = 'brandon@ultriumai.com';

-- Also update the credit limit to enterprise level (15,000)
UPDATE public.user_credits 
SET 
  credits_limit = 15000,
  updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'brandon@ultriumai.com');