
-- ══════════════════════════════════════════════════════════════
-- Reseller / MSP Partner Program Database Schema
-- ══════════════════════════════════════════════════════════════

-- 1. Partner Organizations (reseller accounts)
CREATE TABLE public.reseller_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  tier TEXT NOT NULL DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'platinum')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'churned')),
  discount_percent NUMERIC NOT NULL DEFAULT 15,
  logo_url TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own partner record"
  ON public.reseller_partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own partner record"
  ON public.reseller_partners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own partner record"
  ON public.reseller_partners FOR UPDATE USING (auth.uid() = user_id);

-- 2. White-Label Theme Configurations
CREATE TABLE public.reseller_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.reseller_partners(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL DEFAULT 'Default',
  primary_color TEXT NOT NULL DEFAULT '#06b6d4',
  secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  accent_color TEXT NOT NULL DEFAULT '#f59e0b',
  background_color TEXT NOT NULL DEFAULT '#050a0a',
  logo_url TEXT,
  favicon_url TEXT,
  custom_domain TEXT,
  company_name_override TEXT,
  tagline TEXT,
  hide_ultrium_branding BOOLEAN NOT NULL DEFAULT false,
  powered_by_text TEXT DEFAULT 'Powered by UltriumAI',
  custom_css TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage their themes"
  ON public.reseller_themes FOR ALL
  USING (partner_id IN (SELECT id FROM public.reseller_partners WHERE user_id = auth.uid()));

-- 3. Provisioned Client Tenants
CREATE TABLE public.reseller_client_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.reseller_partners(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_domain TEXT,
  seat_count INTEGER NOT NULL DEFAULT 1,
  enabled_modules TEXT[] NOT NULL DEFAULT '{}',
  monthly_price_per_seat NUMERIC NOT NULL DEFAULT 0,
  resale_price_per_seat NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'churned', 'trial')),
  provisioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  msp_client_id UUID REFERENCES public.msp_clients(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_client_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage their client tenants"
  ON public.reseller_client_tenants FOR ALL
  USING (partner_id IN (SELECT id FROM public.reseller_partners WHERE user_id = auth.uid()));

-- 4. Reseller Billing / Revenue Tracking
CREATE TABLE public.reseller_billing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.reseller_partners(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.reseller_client_tenants(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  wholesale_amount NUMERIC NOT NULL DEFAULT 0,
  resale_amount NUMERIC NOT NULL DEFAULT 0,
  margin_amount NUMERIC NOT NULL DEFAULT 0,
  seat_count INTEGER NOT NULL DEFAULT 0,
  modules TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'void')),
  invoice_url TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_billing_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their billing records"
  ON public.reseller_billing_records FOR SELECT
  USING (partner_id IN (SELECT id FROM public.reseller_partners WHERE user_id = auth.uid()));

-- 5. Marketing Kit Assets
CREATE TABLE public.reseller_marketing_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.reseller_partners(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('proposal', 'one_pager', 'slide_deck', 'email_template', 'case_study')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  is_co_branded BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.reseller_marketing_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage their marketing assets"
  ON public.reseller_marketing_assets FOR ALL
  USING (partner_id IN (SELECT id FROM public.reseller_partners WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_reseller_partners_updated_at
  BEFORE UPDATE ON public.reseller_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reseller_themes_updated_at
  BEFORE UPDATE ON public.reseller_themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reseller_client_tenants_updated_at
  BEFORE UPDATE ON public.reseller_client_tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
