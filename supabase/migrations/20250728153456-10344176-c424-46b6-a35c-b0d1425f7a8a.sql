-- Remove GPT/AI Agent references from platform plans and clean up duplicates

-- First, let's clean up the pricing_plans table and remove GPT references
DELETE FROM pricing_plans WHERE category = 'platform';

-- Insert clean platform plans without any GPT/AI Agent features
INSERT INTO pricing_plans (name, category, monthly_price, yearly_price, onboarding_fee, trial_days, features, limits) VALUES
(
  'Starter',
  'platform', 
  149,
  1490,
  0,
  14,
  '["Up to 10 team members", "Basic security scanning", "Email support", "Standard integrations", "10GB storage", "Basic analytics"]'::jsonb,
  '{"users": 10, "storage": "10GB"}'::jsonb
),
(
  'Professional',
  'platform',
  299, 
  2990,
  0,
  14,
  '["Up to 50 team members", "Advanced security suite", "Mobile technician apps (iOS & Android)", "Full MSP dashboard", "Priority support", "Premium integrations", "50GB storage", "Advanced analytics", "Custom workflows", "API access"]'::jsonb,
  '{"users": 50, "storage": "50GB"}'::jsonb
),
(
  'Enterprise',
  'platform',
  599,
  5990, 
  0,
  14,
  '["Unlimited team members", "White-label solutions", "Enterprise security & compliance", "Dedicated account manager", "24/7 phone support", "Custom integrations", "100GB storage + additional available", "Custom reporting", "SLA guarantees", "On-premise deployment", "Advanced user management", "Custom training"]'::jsonb,
  '{"users": "unlimited", "storage": "100GB+"}'::jsonb
);