-- Add assigned_agent_id to pentest_organizations
ALTER TABLE public.pentest_organizations 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE SET NULL;

-- Remove IP tracking columns (optional - keeping for backwards compatibility but not using)
-- We'll keep the columns but just won't use them in the UI

-- Create index for agent lookup
CREATE INDEX IF NOT EXISTS idx_pentest_organizations_agent ON public.pentest_organizations(assigned_agent_id);