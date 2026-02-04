-- Clean up duplicate R16 agents, keeping only the most recent one
-- First delete metrics for stale agents
DELETE FROM vanguard_agent_metrics 
WHERE agent_id IN (
  SELECT id FROM vanguard_agents 
  WHERE name = 'R16' 
  AND id != 'fd698d3d-9167-478a-8d89-2c898e72cbf6'
);

-- Delete commands for stale agents
DELETE FROM vanguard_agent_commands 
WHERE agent_id IN (
  SELECT id FROM vanguard_agents 
  WHERE name = 'R16' 
  AND id != 'fd698d3d-9167-478a-8d89-2c898e72cbf6'
);

-- Delete the stale agents
DELETE FROM vanguard_agents 
WHERE name = 'R16' 
AND id != 'fd698d3d-9167-478a-8d89-2c898e72cbf6';