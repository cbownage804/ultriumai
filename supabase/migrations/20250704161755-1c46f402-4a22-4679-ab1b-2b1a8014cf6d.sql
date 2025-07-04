-- Update credit limits based on subscription tiers
-- First, let's set default limits for existing users based on their subscription
UPDATE user_credits 
SET credits_limit = CASE 
  WHEN user_id IN (
    SELECT user_id FROM subscribers 
    WHERE subscription_tier = 'enterprise' AND subscribed = true
  ) THEN 15000
  WHEN user_id IN (
    SELECT user_id FROM subscribers 
    WHERE subscription_tier = 'premium' AND subscribed = true
  ) THEN 5000
  ELSE 500
END;

-- Create function to automatically set credit limits when subscription changes
CREATE OR REPLACE FUNCTION update_credit_limits_on_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update credit limit based on subscription tier
  UPDATE user_credits 
  SET credits_limit = CASE 
    WHEN NEW.subscription_tier = 'enterprise' AND NEW.subscribed = true THEN 15000
    WHEN NEW.subscription_tier = 'premium' AND NEW.subscribed = true THEN 5000
    ELSE 500
  END
  WHERE user_id = NEW.user_id;
  
  -- Create credits record if it doesn't exist
  INSERT INTO user_credits (user_id, credits_used, credits_limit)
  SELECT NEW.user_id, 0, 
    CASE 
      WHEN NEW.subscription_tier = 'enterprise' AND NEW.subscribed = true THEN 15000
      WHEN NEW.subscription_tier = 'premium' AND NEW.subscribed = true THEN 5000
      ELSE 500
    END
  WHERE NOT EXISTS (
    SELECT 1 FROM user_credits WHERE user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update credit limits when subscription changes
DROP TRIGGER IF EXISTS trigger_update_credit_limits ON subscribers;
CREATE TRIGGER trigger_update_credit_limits
  AFTER INSERT OR UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_limits_on_subscription_change();