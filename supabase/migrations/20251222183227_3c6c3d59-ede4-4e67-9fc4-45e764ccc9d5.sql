-- Add agent_id column to security_incidents to link threats to specific Vanguard devices
ALTER TABLE public.security_incidents 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.vanguard_agents(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_incidents_agent_id ON public.security_incidents(agent_id);

-- Add comment for clarity
COMMENT ON COLUMN public.security_incidents.agent_id IS 'Reference to the Vanguard agent that detected this incident';