-- Update user_credits table to work with subscription system
-- Add missing columns if they don't exist
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS reset_date TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + INTERVAL '1 month');

-- Update credit limits based on current subscription tiers
UPDATE public.user_credits 
SET credits_limit = CASE 
  WHEN user_id IN (
    SELECT user_id FROM public.subscribers 
    WHERE subscription_tier = 'enterprise' AND subscribed = true
  ) THEN 15000
  WHEN user_id IN (
    SELECT user_id FROM public.subscribers 
    WHERE subscription_tier = 'premium' AND subscribed = true
  ) THEN 5000
  ELSE 500
END;

-- Create grace period tracking for failed payments
CREATE TABLE IF NOT EXISTS public.subscription_grace_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id TEXT NOT NULL,
  grace_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  grace_period_end TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT 'payment_failed',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on grace periods table
ALTER TABLE public.subscription_grace_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for grace periods
CREATE POLICY "Users can view their own grace periods" ON public.subscription_grace_periods
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage grace periods" ON public.subscription_grace_periods
FOR ALL USING (true);

-- Create notification preferences table for subscription alerts
CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  renewal_reminder_enabled BOOLEAN DEFAULT true,
  payment_failure_alerts BOOLEAN DEFAULT true,
  trial_expiration_warnings BOOLEAN DEFAULT true,
  usage_limit_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notification preferences
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON public.subscription_notifications
FOR ALL USING (user_id = auth.uid());

-- Create function to automatically set up user preferences on signup
CREATE OR REPLACE FUNCTION public.setup_user_subscription_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default notification preferences
  INSERT INTO public.subscription_notifications (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default credit allocation
  INSERT INTO public.user_credits (user_id, credits_used, credits_limit)
  VALUES (NEW.id, 0, 500)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS setup_subscription_defaults_on_signup ON auth.users;
CREATE TRIGGER setup_subscription_defaults_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.setup_user_subscription_defaults();

-- Update trigger function for credit limit updates
CREATE OR REPLACE FUNCTION public.update_credit_limits_on_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update credit limit based on subscription tier with more granular control
  UPDATE public.user_credits 
  SET 
    credits_limit = CASE 
      WHEN NEW.subscription_tier = 'enterprise' AND NEW.subscribed = true THEN 15000
      WHEN NEW.subscription_tier = 'premium' AND NEW.subscribed = true THEN 5000
      ELSE 500
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Create credits record if it doesn't exist
  INSERT INTO public.user_credits (user_id, credits_used, credits_limit)
  SELECT NEW.user_id, 0, 
    CASE 
      WHEN NEW.subscription_tier = 'enterprise' AND NEW.subscribed = true THEN 15000
      WHEN NEW.subscription_tier = 'premium' AND NEW.subscribed = true THEN 5000
      ELSE 500
    END
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_credits WHERE user_id = NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_grace_periods_user_id 
ON public.subscription_grace_periods(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_grace_periods_resolved 
ON public.subscription_grace_periods(resolved, grace_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_notifications_user_id 
ON public.subscription_notifications(user_id);