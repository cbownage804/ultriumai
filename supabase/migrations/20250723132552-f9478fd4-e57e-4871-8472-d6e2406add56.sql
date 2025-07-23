-- Check if we need a separate devices table or use existing safenet_devices
-- The edge functions currently reference safenet_devices, so let's ensure device_commands 
-- table structure matches what the edge functions expect

-- Update device_commands table to match edge function expectations
ALTER TABLE public.device_commands 
ADD COLUMN IF NOT EXISTS command_type TEXT;

-- Update the command_type column to be NOT NULL with a default
UPDATE public.device_commands 
SET command_type = type 
WHERE command_type IS NULL;

-- Add constraint to ensure command_type is not null going forward
ALTER TABLE public.device_commands 
ALTER COLUMN command_type SET NOT NULL;

-- Create RLS policies for device_commands if they don't exist
DROP POLICY IF EXISTS "Service can manage device commands" ON public.device_commands;
CREATE POLICY "Service can manage device commands" 
ON public.device_commands 
FOR ALL 
USING (true);

DROP POLICY IF EXISTS "Users can view commands for their devices" ON public.device_commands;
CREATE POLICY "Users can view commands for their devices" 
ON public.device_commands 
FOR SELECT 
USING (
  device_id IN (
    SELECT id FROM public.safenet_devices 
    WHERE user_id = auth.uid()
  )
);