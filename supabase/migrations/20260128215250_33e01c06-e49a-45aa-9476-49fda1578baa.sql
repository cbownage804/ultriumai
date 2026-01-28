-- Reset cached subscription data to force fresh Stripe lookup
UPDATE subscribers 
SET updated_at = '2020-01-01T00:00:00Z'
WHERE email = 'brandon@ultriumai.com';