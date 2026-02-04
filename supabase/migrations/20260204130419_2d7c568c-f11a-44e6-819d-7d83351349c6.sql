-- Increase token column length to accommodate full provisioning tokens
-- Token format: vgd_pt_<64 hex chars> = 72 characters total
ALTER TABLE public.agent_provisioning_tokens 
ALTER COLUMN token TYPE VARCHAR(128);