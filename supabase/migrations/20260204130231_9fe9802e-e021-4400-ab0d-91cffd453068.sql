-- Update ubuntu device to be a Recon Unit (pi_appliance)
UPDATE public.vanguard_agents 
SET agent_type = 'pi_appliance', 
    updated_at = now()
WHERE name = 'ubuntu' 
  AND id = '053b0bc1-7888-4138-b797-d2ca5cae2522';