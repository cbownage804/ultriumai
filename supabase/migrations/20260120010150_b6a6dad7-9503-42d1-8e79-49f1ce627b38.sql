-- SafeSuite Subscriptions table
CREATE TABLE public.safesuite_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'business')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT safesuite_subscriptions_user_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.safesuite_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
ON public.safesuite_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.safesuite_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.safesuite_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- SafeSuite Usage Tracking table
CREATE TABLE public.safesuite_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product TEXT NOT NULL CHECK (product IN ('safepass', 'safescan', 'safeweb', 'safetrack')),
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT safesuite_usage_user_product_period UNIQUE (user_id, product, period_start)
);

-- Enable RLS
ALTER TABLE public.safesuite_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
ON public.safesuite_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.safesuite_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.safesuite_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_safesuite_subscriptions_updated_at
  BEFORE UPDATE ON public.safesuite_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safesuite_usage_updated_at
  BEFORE UPDATE ON public.safesuite_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_safesuite_subscriptions_user ON public.safesuite_subscriptions(user_id);
CREATE INDEX idx_safesuite_subscriptions_status ON public.safesuite_subscriptions(status);
CREATE INDEX idx_safesuite_usage_user_product ON public.safesuite_usage(user_id, product);
CREATE INDEX idx_safesuite_usage_period ON public.safesuite_usage(period_start, period_end);