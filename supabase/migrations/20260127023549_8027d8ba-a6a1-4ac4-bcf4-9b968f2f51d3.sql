-- Migrate to Lovable-style credit system with daily + monthly credits
-- Daily credits: 5/day, reset daily, don't roll over
-- Monthly credits: Based on tier, tied to billing period

-- Add new columns for the dual credit system
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS daily_credits_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_credits_limit integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS daily_reset_at timestamp with time zone DEFAULT (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day'),
ADD COLUMN IF NOT EXISTS monthly_credits_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_credits_limit integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reset_at timestamp with time zone DEFAULT (date_trunc('month', now()) + interval '1 month'),
ADD COLUMN IF NOT EXISTS billing_period_start timestamp with time zone DEFAULT now();

-- Update existing records with proper defaults
UPDATE public.user_credits 
SET 
  daily_credits_used = 0,
  daily_credits_limit = 5,
  daily_reset_at = (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day'),
  monthly_credits_used = 0,
  monthly_credits_limit = CASE 
    WHEN credits_limit >= 15000 THEN 15000  -- Enterprise
    WHEN credits_limit >= 5000 THEN 5000    -- Premium  
    WHEN credits_limit >= 500 THEN 100      -- Pro
    ELSE 0                                   -- Free
  END,
  monthly_reset_at = reset_date,
  billing_period_start = COALESCE(last_reset, now())
WHERE daily_credits_limit IS NULL OR daily_credits_limit = 5;

-- Create function to get monthly credits based on subscription tier
CREATE OR REPLACE FUNCTION public.get_monthly_credits_for_tier(tier text, is_subscribed boolean)
RETURNS integer AS $$
BEGIN
  IF NOT is_subscribed THEN
    RETURN 0;  -- Free tier gets no monthly credits, only daily
  END IF;
  
  RETURN CASE tier
    WHEN 'enterprise' THEN 15000
    WHEN 'premium' THEN 5000
    WHEN 'pro' THEN 100
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Update the trigger to set proper credit limits based on subscription
CREATE OR REPLACE FUNCTION public.update_credits_on_subscription_change()
RETURNS trigger AS $$
BEGIN
  -- Update monthly credits limit based on new subscription tier
  UPDATE user_credits 
  SET 
    monthly_credits_limit = public.get_monthly_credits_for_tier(NEW.subscription_tier, NEW.subscribed),
    monthly_credits_used = CASE 
      WHEN NEW.subscribed AND NOT COALESCE(OLD.subscribed, false) THEN 0  -- Reset on new subscription
      ELSE monthly_credits_used
    END,
    billing_period_start = CASE
      WHEN NEW.subscribed AND NOT COALESCE(OLD.subscribed, false) THEN now()
      ELSE billing_period_start
    END,
    monthly_reset_at = CASE
      WHEN NEW.subscribed AND NOT COALESCE(OLD.subscribed, false) THEN now() + interval '1 month'
      ELSE monthly_reset_at
    END
  WHERE user_id = NEW.user_id;
  
  -- Create credits record if it doesn't exist
  INSERT INTO user_credits (
    user_id, 
    daily_credits_used, 
    daily_credits_limit,
    daily_reset_at,
    monthly_credits_used, 
    monthly_credits_limit,
    monthly_reset_at,
    billing_period_start
  )
  SELECT 
    NEW.user_id, 
    0, 
    5,  -- Everyone gets 5 daily credits
    (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day'),
    0,
    public.get_monthly_credits_for_tier(NEW.subscription_tier, NEW.subscribed),
    now() + interval '1 month',
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM user_credits WHERE user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_subscription_change ON public.subscribers;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_credits_on_subscription_change();

-- Update action_type constraint to include new types
ALTER TABLE public.credit_history 
DROP CONSTRAINT IF EXISTS credit_history_action_type_check;

ALTER TABLE public.credit_history 
ADD CONSTRAINT credit_history_action_type_check 
CHECK (action_type IN ('usage', 'purchase', 'reset', 'bonus', 'daily_reset', 'monthly_reset'));