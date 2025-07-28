-- Create billing periods table
CREATE TABLE public.msp_billing_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'sent', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.msp_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  billing_period_id UUID NOT NULL REFERENCES public.msp_billing_periods(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal INTEGER NOT NULL DEFAULT 0, -- in cents
  tax_amount INTEGER NOT NULL DEFAULT 0, -- in cents
  total_amount INTEGER NOT NULL DEFAULT 0, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice line items table
CREATE TABLE public.msp_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.msp_invoices(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL, -- in cents
  total_price INTEGER NOT NULL, -- in cents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing templates table for recurring services
CREATE TABLE public.msp_billing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  unit_price INTEGER NOT NULL, -- in cents
  billing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'quarterly', 'annually')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.msp_billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_billing_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing periods
CREATE POLICY "Users can view their own billing periods" 
ON public.msp_billing_periods 
FOR SELECT 
USING (auth.uid() = msp_user_id);

CREATE POLICY "Users can create their own billing periods" 
ON public.msp_billing_periods 
FOR INSERT 
WITH CHECK (auth.uid() = msp_user_id);

CREATE POLICY "Users can update their own billing periods" 
ON public.msp_billing_periods 
FOR UPDATE 
USING (auth.uid() = msp_user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.msp_invoices 
FOR SELECT 
USING (auth.uid() = msp_user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.msp_invoices 
FOR INSERT 
WITH CHECK (auth.uid() = msp_user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.msp_invoices 
FOR UPDATE 
USING (auth.uid() = msp_user_id);

-- RLS Policies for invoice items
CREATE POLICY "Users can view invoice items for their invoices" 
ON public.msp_invoice_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.msp_invoices 
    WHERE msp_invoices.id = msp_invoice_items.invoice_id 
    AND msp_invoices.msp_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create invoice items for their invoices" 
ON public.msp_invoice_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.msp_invoices 
    WHERE msp_invoices.id = msp_invoice_items.invoice_id 
    AND msp_invoices.msp_user_id = auth.uid()
  )
);

-- RLS Policies for billing templates
CREATE POLICY "Users can view their own billing templates" 
ON public.msp_billing_templates 
FOR SELECT 
USING (auth.uid() = msp_user_id);

CREATE POLICY "Users can create their own billing templates" 
ON public.msp_billing_templates 
FOR INSERT 
WITH CHECK (auth.uid() = msp_user_id);

CREATE POLICY "Users can update their own billing templates" 
ON public.msp_billing_templates 
FOR UPDATE 
USING (auth.uid() = msp_user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_msp_billing_periods_updated_at
    BEFORE UPDATE ON public.msp_billing_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_msp_invoices_updated_at
    BEFORE UPDATE ON public.msp_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_msp_billing_templates_updated_at
    BEFORE UPDATE ON public.msp_billing_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get the next invoice number (simple incrementing)
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
    FROM public.msp_invoices
    INTO next_number;
    
    invoice_number := 'INV-' || LPAD(next_number::TEXT, 6, '0');
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;