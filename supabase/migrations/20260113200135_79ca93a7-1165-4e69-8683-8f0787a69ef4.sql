-- Create user subscriptions table for tracking Vanguard tiers
CREATE TABLE public.vanguard_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'professional', 'enterprise')),
  seat_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'manual')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  admin_override BOOLEAN DEFAULT false,
  admin_override_by UUID,
  admin_override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.vanguard_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.vanguard_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins (Ultrium employees) can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.vanguard_subscriptions
FOR SELECT
USING (public.is_ultrium_employee(auth.uid()));

-- Admins can update any subscription (for manual tier assignment)
CREATE POLICY "Admins can update subscriptions"
ON public.vanguard_subscriptions
FOR UPDATE
USING (public.is_ultrium_employee(auth.uid()));

-- Admins can insert subscriptions
CREATE POLICY "Admins can insert subscriptions"
ON public.vanguard_subscriptions
FOR INSERT
WITH CHECK (public.is_ultrium_employee(auth.uid()) OR auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_vanguard_subscriptions_updated_at
  BEFORE UPDATE ON public.vanguard_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();