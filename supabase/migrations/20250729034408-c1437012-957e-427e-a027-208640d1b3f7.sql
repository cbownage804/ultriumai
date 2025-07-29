-- Create billing and invoicing system for all customer segments

-- Invoice templates for different billing scenarios
CREATE TABLE public.invoice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'msp_client', 'internal_department', 'cost_center'
  header_html TEXT,
  footer_html TEXT,
  terms_conditions TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  auto_send BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced invoices table for all use cases
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID, -- MSP client or internal department
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL, -- 'client_bill', 'internal_chargeback', 'cost_allocation'
  billing_period_start DATE,
  billing_period_end DATE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  payment_method TEXT,
  payment_date DATE,
  notes TEXT,
  internal_notes TEXT,
  template_id UUID REFERENCES public.invoice_templates(id),
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoice line items for detailed billing
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'service', 'license', 'hardware', 'support', 'usage'
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_period_start DATE,
  billing_period_end DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Billing schedules for recurring charges
CREATE TABLE public.billing_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID, -- can be MSP client or internal department
  schedule_name TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual', 'usage_based'
  service_items JSONB NOT NULL DEFAULT '[]', -- array of recurring service items
  next_billing_date DATE NOT NULL,
  last_billed_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_invoice BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payment tracking for all invoice types
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL, -- 'bank_transfer', 'credit_card', 'check', 'internal_transfer'
  payment_reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cost centers for enterprise internal billing
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cost_center_code TEXT NOT NULL,
  cost_center_name TEXT NOT NULL,
  department TEXT,
  manager_email TEXT,
  budget_amount DECIMAL(12,2),
  budget_period TEXT DEFAULT 'annual', -- 'monthly', 'quarterly', 'annual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cost_center_code)
);

-- Usage tracking for usage-based billing
CREATE TABLE public.billing_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  usage_type TEXT NOT NULL, -- 'api_calls', 'storage_gb', 'support_hours', 'device_count'
  usage_amount DECIMAL(10,4) NOT NULL,
  usage_unit TEXT NOT NULL, -- 'calls', 'gb', 'hours', 'devices'
  billing_rate DECIMAL(10,4),
  tracking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Invoice templates policies
CREATE POLICY "Users can manage their own invoice templates" 
ON public.invoice_templates FOR ALL 
USING (user_id = auth.uid());

-- Invoices policies
CREATE POLICY "Users can manage their own invoices" 
ON public.invoices FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Clients can view their invoices" 
ON public.invoices FOR SELECT 
USING (client_id IN (
  SELECT id FROM public.msp_clients mc 
  JOIN public.client_users cu ON cu.client_id = mc.id 
  WHERE cu.user_id = auth.uid()
));

-- Invoice line items policies
CREATE POLICY "Users can manage line items for their invoices" 
ON public.invoice_line_items FOR ALL 
USING (invoice_id IN (
  SELECT id FROM public.invoices WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can view line items for their invoices" 
ON public.invoice_line_items FOR SELECT 
USING (invoice_id IN (
  SELECT i.id FROM public.invoices i
  JOIN public.msp_clients mc ON mc.id = i.client_id
  JOIN public.client_users cu ON cu.client_id = mc.id 
  WHERE cu.user_id = auth.uid()
));

-- Billing schedules policies
CREATE POLICY "Users can manage their own billing schedules" 
ON public.billing_schedules FOR ALL 
USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can manage payments for their invoices" 
ON public.payments FOR ALL 
USING (invoice_id IN (
  SELECT id FROM public.invoices WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can view payments for their invoices" 
ON public.payments FOR SELECT 
USING (invoice_id IN (
  SELECT i.id FROM public.invoices i
  JOIN public.msp_clients mc ON mc.id = i.client_id
  JOIN public.client_users cu ON cu.client_id = mc.id 
  WHERE cu.user_id = auth.uid()
));

-- Cost centers policies
CREATE POLICY "Users can manage their own cost centers" 
ON public.cost_centers FOR ALL 
USING (user_id = auth.uid());

-- Usage tracking policies
CREATE POLICY "Users can manage their own usage tracking" 
ON public.billing_usage_tracking FOR ALL 
USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_invoice_templates_updated_at
BEFORE UPDATE ON public.invoice_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_schedules_updated_at
BEFORE UPDATE ON public.billing_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
    FROM public.invoices
    INTO next_number;
    
    invoice_number := 'INV-' || LPAD(next_number::TEXT, 8, '0');
    RETURN invoice_number;
END;
$$;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax_rate DECIMAL(5,4);
    v_tax_amount DECIMAL(10,2);
    v_discount_amount DECIMAL(10,2);
    v_total_amount DECIMAL(10,2);
BEGIN
    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(line_total), 0)
    INTO v_subtotal
    FROM public.invoice_line_items
    WHERE invoice_id = p_invoice_id;
    
    -- Get tax rate and discount from invoice
    SELECT tax_rate, discount_amount
    INTO v_tax_rate, v_discount_amount
    FROM public.invoices
    WHERE id = p_invoice_id;
    
    -- Calculate tax amount on subtotal minus discount
    v_tax_amount := (v_subtotal - COALESCE(v_discount_amount, 0)) * COALESCE(v_tax_rate, 0);
    v_total_amount := v_subtotal - COALESCE(v_discount_amount, 0) + v_tax_amount;
    
    -- Update invoice totals
    UPDATE public.invoices 
    SET 
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total_amount,
        updated_at = now()
    WHERE id = p_invoice_id;
END;
$$;

-- Trigger to recalculate invoice totals when line items change
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.calculate_invoice_totals(OLD.invoice_id);
        RETURN OLD;
    ELSE
        PERFORM public.calculate_invoice_totals(NEW.invoice_id);
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER recalculate_invoice_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();