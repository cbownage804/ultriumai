-- Update subscribers table to better handle subscription management
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS price_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE USING (user_id = auth.uid());

-- Allow system to insert/update subscription data
CREATE POLICY "System can manage subscriptions" ON public.subscribers
FOR ALL USING (true);