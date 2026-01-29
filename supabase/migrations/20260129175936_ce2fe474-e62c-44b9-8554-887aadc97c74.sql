-- Update the ubuntu device to be a recon unit (pi_appliance)
UPDATE vanguard_agents 
SET agent_type = 'pi_appliance' 
WHERE name ILIKE '%ubuntu%' OR name ILIKE '%pi%';