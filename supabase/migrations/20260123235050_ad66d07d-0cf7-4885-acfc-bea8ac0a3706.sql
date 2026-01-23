-- Clean up duplicate vaults: keep only the oldest one per user
-- First, identify the oldest vault per user
WITH oldest_vaults AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM safepass_vaults
  ORDER BY user_id, created_at ASC
),
-- Delete all vaults except the oldest one for each user
deleted AS (
  DELETE FROM safepass_vaults
  WHERE id NOT IN (SELECT id FROM oldest_vaults)
  RETURNING id
)
SELECT COUNT(*) as deleted_count FROM deleted;

-- Add unique constraint to prevent future duplicates on vault names per user
-- (Allow multiple vaults but prevent auto-creating duplicates with same name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_safepass_vaults_user_name 
ON safepass_vaults (user_id, vault_name) 
WHERE vault_name = 'My Vault';