-- Add unique constraints on user_id for subscription tables to enable upsert operations

-- Subscribers table (AI Studio)
ALTER TABLE public.subscribers 
ADD CONSTRAINT subscribers_user_id_unique UNIQUE (user_id);

-- SafeSuite subscriptions table
ALTER TABLE public.safesuite_subscriptions 
ADD CONSTRAINT safesuite_subscriptions_user_id_unique UNIQUE (user_id);

-- Vanguard subscriptions table
ALTER TABLE public.vanguard_subscriptions 
ADD CONSTRAINT vanguard_subscriptions_user_id_unique UNIQUE (user_id);