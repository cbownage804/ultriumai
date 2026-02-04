-- Step 1: Add client_id columns to link tables together
-- comanaged_organizations -> msp_clients
ALTER TABLE public.comanaged_organizations 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.msp_clients(id);

-- rmm_customers -> msp_clients (so we can find tickets for a given MSP client)
ALTER TABLE public.rmm_customers 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.msp_clients(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comanaged_organizations_client_id 
ON public.comanaged_organizations(client_id);

CREATE INDEX IF NOT EXISTS idx_rmm_customers_client_id 
ON public.rmm_customers(client_id);