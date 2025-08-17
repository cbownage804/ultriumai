-- Fix critical security vulnerability in subscribers table
-- Remove overly permissive policies and replace with secure ones

-- Drop the problematic overly permissive policies
DROP POLICY IF EXISTS "Service can manage subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create secure replacement policies for system operations
-- Only allow service role (not public) for system operations
CREATE POLICY "Service role can manage subscriptions"
ON public.subscribers
FOR ALL
TO service_role
USING (true);

-- Allow authenticated users to only view their own subscription data
CREATE POLICY "Users can view own subscription by user_id"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view own subscription by email"
ON public.subscribers
FOR SELECT
TO authenticated  
USING (email = auth.email());

-- Allow authenticated users to update only their own subscription
CREATE POLICY "Users can update own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR email = auth.email())
WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Allow system to insert new subscriptions (for new signups)
CREATE POLICY "System can insert subscriptions"
ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow authenticated users to insert their own subscription
CREATE POLICY "Authenticated users can insert own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR email = auth.email());