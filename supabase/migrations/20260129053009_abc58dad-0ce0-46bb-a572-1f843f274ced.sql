-- Add client_id column to vanguard_agents table
-- This allows associating devices with specific MSP clients

ALTER TABLE public.vanguard_agents 
ADD COLUMN client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL;

-- Create an index for faster client-based queries
CREATE INDEX idx_vanguard_agents_client_id ON public.vanguard_agents(client_id);

-- Add a comment for documentation
COMMENT ON COLUMN public.vanguard_agents.client_id IS 'Optional reference to the MSP client this device belongs to';