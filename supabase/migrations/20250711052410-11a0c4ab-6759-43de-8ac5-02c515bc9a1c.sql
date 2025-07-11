-- Fix the foreign key constraint for msp_clients table
-- Drop the existing foreign key constraint
ALTER TABLE public.msp_clients 
DROP CONSTRAINT IF EXISTS fk_msp_clients_organization;

-- Add the correct foreign key constraint to reference msps table
ALTER TABLE public.msp_clients 
ADD CONSTRAINT fk_msp_clients_msp 
FOREIGN KEY (msp_id) REFERENCES public.msps(id) ON DELETE CASCADE;