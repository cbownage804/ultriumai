-- Add foreign key constraint between msp_clients and msp_organizations
ALTER TABLE public.msp_clients 
ADD CONSTRAINT fk_msp_clients_organization 
FOREIGN KEY (msp_id) REFERENCES public.msp_organizations(id) ON DELETE CASCADE;

-- Also add index for better performance
CREATE INDEX IF NOT EXISTS idx_msp_clients_msp_id ON public.msp_clients(msp_id);