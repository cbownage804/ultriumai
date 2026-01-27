-- Ensure RLS is enabled on subscribers table
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- Create secure RLS policies for subscribers
-- Only allow users to see their own subscription data
CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only allow users to insert their own subscription record
CREATE POLICY "Users can insert their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own subscription
CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);