-- ============================================
-- VANGUARD RECON COMMERCIALIZATION TABLES
-- ============================================

-- 1. Recon Orders - Customer orders for Recon Units
CREATE TABLE public.recon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  msp_client_id UUID REFERENCES public.msp_clients(id),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'paid', 'provisioning', 'shipped', 'delivered', 'active', 'cancelled')),
  hardware_tier TEXT NOT NULL CHECK (hardware_tier IN ('lite', 'pro')),
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('essential', 'professional', 'enterprise')),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  subscription_price_cents INTEGER NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  stripe_payment_intent TEXT,
  stripe_checkout_session TEXT,
  stripe_subscription_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  tracking_number TEXT,
  shipping_carrier TEXT
);

-- 2. Recon Inventory - Physical unit tracking
CREATE TABLE public.recon_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  mac_address TEXT UNIQUE,
  hardware_tier TEXT NOT NULL CHECK (hardware_tier IN ('lite', 'pro')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'assigned', 'shipped', 'active', 'retired', 'rma')),
  assigned_order_id UUID REFERENCES public.recon_orders(id),
  activation_key TEXT UNIQUE,
  agent_id UUID REFERENCES public.vanguard_agents(id),
  firmware_version TEXT,
  notes TEXT,
  provisioned_at TIMESTAMPTZ,
  provisioned_by UUID REFERENCES auth.users(id),
  shipped_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Recon Subscriptions - Monthly billing for active units
CREATE TABLE public.recon_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  recon_unit_id UUID REFERENCES public.recon_inventory(id) NOT NULL,
  order_id UUID REFERENCES public.recon_orders(id),
  tier TEXT NOT NULL CHECK (tier IN ('essential', 'professional', 'enterprise')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  price_cents INTEGER NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Recon Activation Logs - Track unit activations
CREATE TABLE public.recon_activation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.recon_inventory(id) NOT NULL,
  activation_key TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'invalid_key', 'already_activated')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_recon_orders_user_id ON public.recon_orders(user_id);
CREATE INDEX idx_recon_orders_status ON public.recon_orders(order_status);
CREATE INDEX idx_recon_orders_created ON public.recon_orders(created_at DESC);
CREATE INDEX idx_recon_inventory_status ON public.recon_inventory(status);
CREATE INDEX idx_recon_inventory_serial ON public.recon_inventory(serial_number);
CREATE INDEX idx_recon_inventory_activation_key ON public.recon_inventory(activation_key);
CREATE INDEX idx_recon_subscriptions_user ON public.recon_subscriptions(user_id);
CREATE INDEX idx_recon_subscriptions_unit ON public.recon_subscriptions(recon_unit_id);
CREATE INDEX idx_recon_subscriptions_status ON public.recon_subscriptions(status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.recon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recon_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recon_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recon_activation_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access to orders
CREATE POLICY "Admin full access to recon_orders"
  ON public.recon_orders FOR ALL
  USING (public.is_admin_user());

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.recon_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admin full access to inventory
CREATE POLICY "Admin full access to recon_inventory"
  ON public.recon_inventory FOR ALL
  USING (public.is_admin_user());

-- Admin full access to subscriptions
CREATE POLICY "Admin full access to recon_subscriptions"
  ON public.recon_subscriptions FOR ALL
  USING (public.is_admin_user());

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.recon_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin full access to activation logs
CREATE POLICY "Admin full access to activation_logs"
  ON public.recon_activation_logs FOR ALL
  USING (public.is_admin_user());

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_recon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_recon_orders_updated_at
  BEFORE UPDATE ON public.recon_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_recon_updated_at();

CREATE TRIGGER update_recon_inventory_updated_at
  BEFORE UPDATE ON public.recon_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_recon_updated_at();

CREATE TRIGGER update_recon_subscriptions_updated_at
  BEFORE UPDATE ON public.recon_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_recon_updated_at();