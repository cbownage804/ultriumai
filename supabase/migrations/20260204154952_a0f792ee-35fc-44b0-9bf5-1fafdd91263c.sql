-- Add rustdesk_id column to vanguard_agents table for RustDesk remote access
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS rustdesk_id TEXT;

-- Add index for faster lookups by RustDesk ID
CREATE INDEX IF NOT EXISTS idx_vanguard_agents_rustdesk_id ON public.vanguard_agents(rustdesk_id) WHERE rustdesk_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.vanguard_agents.rustdesk_id IS 'RustDesk remote desktop ID reported by the agent';