-- Enable RLS on subscribers table if not already enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can delete their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Deny anonymous access to subscribers" ON public.subscribers;

-- Policy: Users can only view their own subscription data
CREATE POLICY "Users can view their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscription
CREATE POLICY "Users can insert their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscription
CREATE POLICY "Users can update their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own subscription
CREATE POLICY "Users can delete their own subscription"
ON public.subscribers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to subscribers"
ON public.subscribers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);