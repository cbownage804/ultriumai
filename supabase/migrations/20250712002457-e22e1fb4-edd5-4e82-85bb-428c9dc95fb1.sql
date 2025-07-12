-- Create business billing infrastructure
CREATE TABLE public.business_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  billing_address JSONB,
  tax_id TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  account_manager_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_customer_id UUID REFERENCES business_customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  package_type TEXT NOT NULL CHECK (package_type IN ('starter', 'professional', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  seat_count INTEGER NOT NULL DEFAULT 1,
  addons JSONB DEFAULT '[]'::jsonb,
  monthly_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.business_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_customer_id UUID REFERENCES business_customers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES business_subscriptions(id),
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
  due_date DATE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  line_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.business_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_customer_id UUID REFERENCES business_customers(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES business_subscriptions(id),
  tracking_period TEXT NOT NULL, -- YYYY-MM format
  seat_usage JSONB DEFAULT '{}'::jsonb,
  feature_usage JSONB DEFAULT '{}'::jsonb,
  addon_usage JSONB DEFAULT '{}'::jsonb,
  overage_charges DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_customer_id, tracking_period)
);

-- Enable RLS
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business customers
CREATE POLICY "Users can manage their own business account" 
ON public.business_customers 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all business customers" 
ON public.business_customers 
FOR SELECT 
USING (auth.email() LIKE '%@ultriumai.com');

-- RLS Policies for business subscriptions
CREATE POLICY "Users can manage their own business subscriptions" 
ON public.business_subscriptions 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all business subscriptions" 
ON public.business_subscriptions 
FOR SELECT 
USING (auth.email() LIKE '%@ultriumai.com');

-- RLS Policies for business invoices
CREATE POLICY "Users can view their own business invoices" 
ON public.business_invoices 
FOR SELECT 
USING (business_customer_id IN (
  SELECT id FROM business_customers WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all business invoices" 
ON public.business_invoices 
FOR ALL 
USING (auth.email() LIKE '%@ultriumai.com');

-- RLS Policies for usage tracking
CREATE POLICY "Users can view their own usage tracking" 
ON public.business_usage_tracking 
FOR SELECT 
USING (business_customer_id IN (
  SELECT id FROM business_customers WHERE user_id = auth.uid()
));

CREATE POLICY "System can manage usage tracking" 
ON public.business_usage_tracking 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_business_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_business_customers_updated_at
  BEFORE UPDATE ON public.business_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_updated_at_column();

CREATE TRIGGER update_business_subscriptions_updated_at
  BEFORE UPDATE ON public.business_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_updated_at_column();

CREATE TRIGGER update_business_invoices_updated_at
  BEFORE UPDATE ON public.business_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_updated_at_column();

CREATE TRIGGER update_business_usage_tracking_updated_at
  BEFORE UPDATE ON public.business_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_updated_at_column();