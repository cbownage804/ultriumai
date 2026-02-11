ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS meshcentral_node_id TEXT,
ADD COLUMN IF NOT EXISTS meshcentral_mesh_id TEXT;