
ALTER TABLE public.safesuite_subscriptions
DROP CONSTRAINT safesuite_subscriptions_tier_check;

ALTER TABLE public.safesuite_subscriptions
ADD CONSTRAINT safesuite_subscriptions_tier_check
CHECK (tier = ANY (ARRAY['free'::text, 'pro'::text, 'business'::text, 'enterprise'::text]));
