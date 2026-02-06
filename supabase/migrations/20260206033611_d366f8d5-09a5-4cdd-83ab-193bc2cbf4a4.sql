-- Add site/office_location association to vanguard_agents
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS office_location_id UUID REFERENCES public.office_locations(id) ON DELETE SET NULL;

-- Create index for efficient site-based queries
CREATE INDEX IF NOT EXISTS idx_vanguard_agents_office_location ON public.vanguard_agents(office_location_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_agents_agent_type ON public.vanguard_agents(agent_type);