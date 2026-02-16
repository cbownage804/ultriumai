
-- Add trial columns to vanguard_subscriptions
ALTER TABLE public.vanguard_subscriptions 
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT false;
