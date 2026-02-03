-- Add encrypted RustDesk password column for unattended access
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS rustdesk_password_encrypted TEXT;

-- Add index for faster lookups
COMMENT ON COLUMN public.vanguard_agents.rustdesk_password_encrypted IS 'Encrypted RustDesk permanent password for unattended access';