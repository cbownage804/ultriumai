-- Create table to track purchased voice credit bundles
CREATE TABLE public.voice_credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes_purchased INTEGER NOT NULL,
  minutes_remaining INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  price_paid_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
);

-- Enable Row Level Security
ALTER TABLE public.voice_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own purchases
CREATE POLICY "Users can view their own voice purchases"
ON public.voice_credit_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own purchases (triggered after payment)
CREATE POLICY "Users can insert their own voice purchases"
ON public.voice_credit_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own purchases (to decrement remaining)
CREATE POLICY "Users can update their own voice purchases"
ON public.voice_credit_purchases
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX idx_voice_credit_purchases_user ON public.voice_credit_purchases(user_id);
CREATE INDEX idx_voice_credit_purchases_remaining ON public.voice_credit_purchases(user_id, minutes_remaining) WHERE minutes_remaining > 0;