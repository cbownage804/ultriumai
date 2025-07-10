-- Clean up duplicate user_credits records, keeping only the latest one per user
WITH ranked_credits AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_credits
  WHERE user_id = 'b8cfe427-6c70-456c-a793-2279f9ddae40'
)
DELETE FROM user_credits 
WHERE user_id = 'b8cfe427-6c70-456c-a793-2279f9ddae40'
  AND id NOT IN (
    SELECT id FROM ranked_credits WHERE rn = 1
  );

-- Ensure there's a unique constraint to prevent future duplicates
ALTER TABLE user_credits 
ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);