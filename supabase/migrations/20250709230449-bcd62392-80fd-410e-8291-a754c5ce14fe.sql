-- Create user permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  permission_value BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

-- Create payment transactions table for detailed payment tracking
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'chargeback', 'adjustment')),
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  payment_method_id TEXT,
  subscription_id UUID REFERENCES subscribers(id),
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription modifications table for tracking changes
CREATE TABLE public.subscription_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscribers(id),
  modification_type TEXT NOT NULL CHECK (modification_type IN ('upgrade', 'downgrade', 'cancel', 'reactivate', 'change_payment')),
  from_tier TEXT,
  to_tier TEXT,
  from_amount INTEGER, -- in cents
  to_amount INTEGER, -- in cents
  proration_amount INTEGER DEFAULT 0, -- in cents, can be negative
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_proration_id TEXT,
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_modifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "UltriumAI employees can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (is_ultrium_employee(auth.uid()));

-- Create policies for payment_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "UltriumAI employees can view all transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (is_ultrium_employee(auth.uid()));

CREATE POLICY "UltriumAI employees can manage transactions" 
ON public.payment_transactions 
FOR ALL 
USING (is_ultrium_employee(auth.uid()));

-- Create policies for subscription_modifications
CREATE POLICY "Users can view their own subscription modifications" 
ON public.subscription_modifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "UltriumAI employees can manage subscription modifications" 
ON public.subscription_modifications 
FOR ALL 
USING (is_ultrium_employee(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_key ON public.user_permissions(permission_key);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_stripe_payment_intent_id ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);
CREATE INDEX idx_subscription_modifications_user_id ON public.subscription_modifications(user_id);
CREATE INDEX idx_subscription_modifications_subscription_id ON public.subscription_modifications(subscription_id);
CREATE INDEX idx_subscription_modifications_created_at ON public.subscription_modifications(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_permissions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamps
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_permissions_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_modifications_updated_at
BEFORE UPDATE ON public.subscription_modifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();