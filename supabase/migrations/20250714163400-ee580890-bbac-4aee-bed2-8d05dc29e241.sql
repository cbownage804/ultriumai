-- Check if pricing_plans table exists, create it if not, and enable RLS
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  monthly_price NUMERIC NOT NULL,
  onboarding_fee NUMERIC,
  features JSONB,
  limits JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read pricing plans (they should be public)
CREATE POLICY "Everyone can read pricing plans" ON public.pricing_plans
FOR SELECT
USING (true);

-- Only allow admins to manage pricing plans
CREATE POLICY "Admins can manage pricing plans" ON public.pricing_plans
FOR ALL
USING (auth.email() LIKE '%@ultriumai.com');

-- Insert some default pricing plans if table is empty
INSERT INTO public.pricing_plans (name, category, monthly_price, onboarding_fee, features, limits)
VALUES 
  (
    'Starter', 
    'platform', 
    149, 
    0,
    '["Up to 10 team members", "5 Custom AI Agents", "Basic security scanning", "Email support", "Standard integrations", "10GB storage", "Basic analytics"]'::jsonb,
    '{"users": 10, "storage": "10GB", "agents": 5}'::jsonb
  ),
  (
    'Professional', 
    'platform', 
    299, 
    0,
    '["Up to 50 team members", "Unlimited Custom AI Agents", "Advanced security suite", "Mobile technician apps", "Full MSP dashboard", "Priority support", "Premium integrations", "50GB storage", "Advanced analytics", "Custom workflows", "API access"]'::jsonb,
    '{"users": 50, "storage": "50GB", "agents": "unlimited"}'::jsonb
  ),
  (
    'Enterprise', 
    'platform', 
    599, 
    0,
    '["Unlimited team members", "White-label solutions", "Enterprise security & compliance", "Dedicated account manager", "24/7 phone support", "Custom integrations", "100GB storage", "Custom reporting", "SLA guarantees", "On-premise deployment", "Advanced user management", "Custom training"]'::jsonb,
    '{"users": "unlimited", "storage": "100GB+", "agents": "unlimited"}'::jsonb
  )
ON CONFLICT DO NOTHING;