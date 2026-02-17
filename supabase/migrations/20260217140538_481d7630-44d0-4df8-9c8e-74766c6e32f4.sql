
-- Temporarily bypass RLS to update user credits
ALTER TABLE user_credits DISABLE ROW LEVEL SECURITY;

UPDATE user_credits 
SET 
  monthly_credits_limit = 100,
  monthly_credits_used = 0,
  monthly_reset_at = '2026-03-17T14:01:00+00:00',
  billing_period_start = '2026-02-17T14:01:00+00:00',
  daily_credits_limit = 10
WHERE user_id = '7b592a7f-16e4-46c2-870d-fa288ca31c31';

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
