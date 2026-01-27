-- Add bonus_credits and last_reset columns to user_credits table
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS bonus_credits integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset timestamp with time zone DEFAULT now();

-- Create credit_history table for tracking all credit transactions
CREATE TABLE IF NOT EXISTS public.credit_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_amount integer NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('usage', 'purchase', 'reset', 'bonus')),
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on credit_history
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credit history
CREATE POLICY "Users can view own credit history"
ON public.credit_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own credit history records
CREATE POLICY "Users can insert own credit history"
ON public.credit_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Deny anonymous access
CREATE POLICY "deny_anon_credit_history"
ON public.credit_history
FOR ALL
TO anon
USING (false);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON public.credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON public.credit_history(created_at DESC);