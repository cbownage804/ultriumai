-- Add business size and onboarding fee fields to msp_clients table
ALTER TABLE public.msp_clients 
ADD COLUMN business_size TEXT DEFAULT 'small' CHECK (business_size IN ('small', 'medium', 'enterprise')),
ADD COLUMN onboarding_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN onboarding_fee_amount DECIMAL(10,2) DEFAULT NULL;