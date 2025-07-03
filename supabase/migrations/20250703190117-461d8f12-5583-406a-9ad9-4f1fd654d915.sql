-- Create credits table to track AI usage
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_limit INTEGER NOT NULL DEFAULT 100,
  reset_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own credits
CREATE POLICY "select_own_credits" ON public.user_credits
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for edge functions to update credits
CREATE POLICY "update_credits" ON public.user_credits
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert credits
CREATE POLICY "insert_credits" ON public.user_credits
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();