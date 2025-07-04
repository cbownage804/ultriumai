-- Create table for security app subscriptions
CREATE TABLE public.security_app_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  usage_current INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 1000
);

-- Enable RLS
ALTER TABLE public.security_app_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own security app subscriptions" 
ON public.security_app_subscriptions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own security app subscriptions" 
ON public.security_app_subscriptions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update security app subscriptions" 
ON public.security_app_subscriptions 
FOR UPDATE 
USING (true);

-- Create index for performance
CREATE INDEX idx_security_app_subscriptions_user_id ON public.security_app_subscriptions(user_id);
CREATE INDEX idx_security_app_subscriptions_app_id ON public.security_app_subscriptions(app_id);

-- Create trigger for updated_at
CREATE TRIGGER update_security_app_subscriptions_updated_at
BEFORE UPDATE ON public.security_app_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();