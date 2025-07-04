-- Fix Brandon's enterprise credits
UPDATE user_credits 
SET credits_limit = 15000, 
    credits_used = 0,
    updated_at = NOW()
WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';

-- If no record exists, create one
INSERT INTO user_credits (user_id, credits_used, credits_limit)
SELECT '453c6d29-34db-4b1a-9f29-3ff7170ae765', 0, 15000
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765'
);

-- Verify the update
SELECT credits_used, credits_limit FROM user_credits 
WHERE user_id = '453c6d29-34db-4b1a-9f29-3ff7170ae765';