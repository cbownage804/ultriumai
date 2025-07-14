-- Update trial periods and create payment system tables
-- Update GPT products to have 7-day trials and everything else 14-day trials

-- Create payment tracking table for one-off payments (onboarding fees)
CREATE TABLE public.one_time_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  product_name TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  payment_type TEXT NOT NULL, -- 'onboarding_fee', 'setup_fee', etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on one-time payments
ALTER TABLE public.one_time_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "users_can_view_own_payments" ON public.one_time_payments
  FOR SELECT
  USING (user_id = auth.uid());

-- System can manage payments
CREATE POLICY "system_can_manage_payments" ON public.one_time_payments
  FOR ALL
  USING (true);

-- Create subscribers table if it doesn't exist (for recurring subscriptions)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  trial_days INTEGER DEFAULT 14, -- Default 14 days, 7 for GPTs
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscribers
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "users_can_view_own_subscription" ON public.subscribers
  FOR SELECT
  USING (user_id = auth.uid() OR email = auth.email());

-- System can manage subscriptions
CREATE POLICY "system_can_manage_subscriptions" ON public.subscribers
  FOR ALL
  USING (true);

-- Create pricing plans table
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'gpt', 'security', 'platform'
  monthly_price INTEGER NOT NULL, -- in cents
  yearly_price INTEGER, -- in cents
  trial_days INTEGER DEFAULT 14,
  onboarding_fee INTEGER DEFAULT 0, -- in cents
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert pricing plans
INSERT INTO public.pricing_plans (name, category, monthly_price, yearly_price, trial_days, onboarding_fee, features, limits) VALUES
-- GPT Plans (7-day trials)
('gpt_starter', 'gpt', 9900, 99000, 7, 5000, '["1 Custom GPT assistant", "500 queries per month", "1GB knowledge base storage", "Up to 3 team seats", "Basic analytics", "API access", "Email support"]', '{"max_gpts": 1, "max_queries": 500, "max_storage_gb": 1, "max_seats": 3}'),
('gpt_professional', 'gpt', 49900, 499000, 7, 15000, '["5 Custom GPT assistants", "2,500 queries per month", "5GB knowledge base storage", "Up to 10 team seats", "Advanced analytics", "White-label deployment", "Priority support"]', '{"max_gpts": 5, "max_queries": 2500, "max_storage_gb": 5, "max_seats": 10}'),
('gpt_enterprise', 'gpt', 0, 0, 7, 50000, '["25 Custom GPT assistants", "Custom query limits", "25GB+ storage", "Unlimited seats", "Enterprise security", "Dedicated account manager", "24/7 support"]', '{"max_gpts": 25, "max_queries": -1, "max_storage_gb": 25, "max_seats": -1}'),

-- Platform Plans (14-day trials)
('starter', 'platform', 14900, 149000, 14, 25000, '["Up to 10 team members", "5 Custom AI Agents", "Basic security scanning", "Email support", "Standard integrations", "10GB storage", "Basic analytics"]', '{"max_members": 10, "max_agents": 5}'),
('professional', 'platform', 29900, 299000, 14, 50000, '["Up to 50 team members", "Unlimited Custom AI Agents", "Advanced security suite", "Mobile apps", "Full MSP dashboard", "Priority support", "Premium integrations", "50GB storage"]', '{"max_members": 50, "max_agents": -1}'),
('enterprise', 'platform', 59900, 599000, 14, 100000, '["Unlimited team members", "White-label solutions", "Enterprise security", "Dedicated account manager", "24/7 phone support", "Custom integrations", "100GB+ storage", "SLA guarantees"]', '{"max_members": -1, "max_agents": -1}'),

-- Security Tools (14-day trials)
('safesoc', 'security', 9900, 99000, 14, 10000, '["Real-time security dashboard", "AI-powered threat intelligence", "Compliance monitoring", "Advanced analytics"]', '{}'),
('safesecure', 'security', 1500, 15000, 14, 5000, '["AI-powered SafeAV protection", "Managed Detection & Response", "24/7 threat monitoring", "Incident response automation"]', '{}'),
('safecenter', 'security', 2500, 25000, 14, 7500, '["Integrated ticketing system", "Remote monitoring & management", "Automated patch management", "Asset management"]', '{}');

-- Create automatic timestamp update trigger
CREATE OR REPLACE FUNCTION public.update_pricing_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pricing_plans_updated_at();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_one_time_payments_updated_at
  BEFORE UPDATE ON public.one_time_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();