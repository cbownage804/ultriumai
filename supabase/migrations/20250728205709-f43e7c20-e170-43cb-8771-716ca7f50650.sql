-- Fix function search_path security warnings
-- Add SET search_path to functions to prevent SQL injection

ALTER FUNCTION public.generate_invoice_number() SET search_path = 'public';

-- Update the existing update_updated_at_column function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';