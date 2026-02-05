-- Add agent_id to atlas_passwords for device-level password linking
ALTER TABLE public.atlas_passwords 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.vanguard_agents(id) ON DELETE CASCADE;

-- Add index for efficient querying by agent
CREATE INDEX IF NOT EXISTS idx_atlas_passwords_agent_id ON public.atlas_passwords(agent_id);

-- Update RLS policy to allow reading passwords for devices the user owns
DROP POLICY IF EXISTS "Users can view their own passwords" ON public.atlas_passwords;
CREATE POLICY "Users can view their own passwords" 
ON public.atlas_passwords 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own passwords" ON public.atlas_passwords;
CREATE POLICY "Users can insert their own passwords" 
ON public.atlas_passwords 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own passwords" ON public.atlas_passwords;
CREATE POLICY "Users can update their own passwords" 
ON public.atlas_passwords 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own passwords" ON public.atlas_passwords;
CREATE POLICY "Users can delete their own passwords" 
ON public.atlas_passwords 
FOR DELETE 
USING (auth.uid() = user_id);