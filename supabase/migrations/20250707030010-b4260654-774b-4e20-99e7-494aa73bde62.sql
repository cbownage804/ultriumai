-- Create missing user profile to fix profile errors
INSERT INTO public.profiles (id, email, full_name, account_type, company_name)
VALUES (
  '453c6d29-34db-4b1a-9f29-3ff7170ae765',
  'brandon.howard@kwccpa.com',
  'Brandon Howard',
  'business',
  'KWC CPA'
)
ON CONFLICT (id) DO UPDATE SET
  account_type = EXCLUDED.account_type,
  company_name = EXCLUDED.company_name,
  updated_at = now();