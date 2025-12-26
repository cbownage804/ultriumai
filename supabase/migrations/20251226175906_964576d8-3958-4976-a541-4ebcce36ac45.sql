
-- Fix remaining functions with mutable search_path

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
    FROM public.msp_invoices
    INTO next_number;
    
    invoice_number := 'INV-' || LPAD(next_number::TEXT, 6, '0');
    RETURN invoice_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    next_number INTEGER;
    ticket_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'TKT-(\d+)') AS INTEGER)), 0) + 1
    FROM public.tickets
    INTO next_number;
    
    ticket_number := 'TKT-' || LPAD(next_number::TEXT, 6, '0');
    RETURN ticket_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_next_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.calculate_next_run(frequency text, schedule_time time without time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    CASE 
      WHEN frequency = 'daily' THEN 
        (CURRENT_DATE + INTERVAL '1 day' + schedule_time)::TIMESTAMP WITH TIME ZONE
      WHEN frequency = 'weekly' THEN 
        (CURRENT_DATE + INTERVAL '7 days' + schedule_time)::TIMESTAMP WITH TIME ZONE
      WHEN frequency = 'monthly' THEN 
        (CURRENT_DATE + INTERVAL '1 month' + schedule_time)::TIMESTAMP WITH TIME ZONE
      ELSE 
        (CURRENT_DATE + INTERVAL '1 day' + schedule_time)::TIMESTAMP WITH TIME ZONE
    END
$function$;
