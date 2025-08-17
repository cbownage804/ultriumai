-- Fix critical security vulnerability in device_commands table
-- Remove overly permissive public access and secure the policies

-- Drop the dangerous policy that allows public access to all operations
DROP POLICY IF EXISTS "Service can manage device commands" ON public.device_commands;

-- Drop the public insert policy without proper authorization
DROP POLICY IF EXISTS "cmds_dash_insert" ON public.device_commands;

-- Create a secure service role policy for system operations only
CREATE POLICY "System can manage device commands"
ON public.device_commands
FOR ALL
TO service_role
USING (true);

-- Create a secure authenticated insert policy for authorized users only
CREATE POLICY "Authenticated users can insert commands for their devices"
ON public.device_commands
FOR INSERT
TO authenticated
WITH CHECK (
  device_id IN (
    SELECT devices.id 
    FROM devices 
    WHERE devices.org_id = current_org_id()
  )
  OR
  device_id IN (
    SELECT safenet_devices.id
    FROM safenet_devices
    WHERE safenet_devices.user_id = auth.uid()
  )
);

-- Ensure existing select policies are properly restricted to authenticated users
-- Update the general select policy to be more restrictive
DROP POLICY IF EXISTS "Users can view commands for their devices" ON public.device_commands;

CREATE POLICY "Authenticated users can view commands for their devices"
ON public.device_commands
FOR SELECT
TO authenticated
USING (
  device_id IN (
    SELECT safenet_devices.id
    FROM safenet_devices
    WHERE safenet_devices.user_id = auth.uid()
  )
);