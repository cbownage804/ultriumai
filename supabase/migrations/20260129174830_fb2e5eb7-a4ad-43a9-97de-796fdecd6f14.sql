-- Add agent_type to distinguish between Windows agents and Pi Appliances
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'windows' CHECK (agent_type IN ('windows', 'pi_appliance'));

-- Add Pi-specific columns for security appliance features
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS firewall_rules JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS traffic_stats JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS threat_detections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ml_model_version TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inference_stats JSONB DEFAULT '{}'::jsonb;

-- Create index for agent_type filtering
CREATE INDEX IF NOT EXISTS idx_vanguard_agents_agent_type ON public.vanguard_agents(agent_type);

-- Update existing agents based on hailo_board_name presence
UPDATE public.vanguard_agents 
SET agent_type = 'pi_appliance' 
WHERE hailo_board_name IS NOT NULL;