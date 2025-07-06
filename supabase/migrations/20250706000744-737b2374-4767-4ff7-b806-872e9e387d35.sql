-- Add unique constraint for security app subscriptions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'security_app_subscriptions_user_app_unique'
    ) THEN
        ALTER TABLE public.security_app_subscriptions 
        ADD CONSTRAINT security_app_subscriptions_user_app_unique 
        UNIQUE (user_id, app_id);
    END IF;
END $$;

-- Set up enterprise subscription for current user (you)
DO $$
DECLARE
    current_user_id uuid := auth.uid();
    current_email text := auth.email();
BEGIN
    IF current_user_id IS NOT NULL THEN
        -- Ensure enterprise subscription
        INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, stripe_customer_id)
        VALUES (
            current_user_id,
            current_email,
            true,
            'enterprise',
            'test_customer_' || current_user_id::text
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            subscribed = true,
            subscription_tier = 'enterprise',
            updated_at = now();

        -- Ensure SafePass subscription is active
        INSERT INTO public.security_app_subscriptions (user_id, app_id, app_name, status, usage_limit, usage_current)
        VALUES (
            current_user_id,
            'safepass',
            'SafePass Password Manager',
            'active',
            -1, -- unlimited for enterprise
            0
        )
        ON CONFLICT (user_id, app_id) 
        DO UPDATE SET 
            status = 'active',
            usage_limit = -1,
            updated_at = now();
    END IF;
END $$;