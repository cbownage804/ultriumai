-- Step 1: Rename UltriumShield tables to SafeShield for SafeSuite branding
ALTER TABLE public.ultrium_shield_endpoints RENAME TO safe_shield_endpoints;
ALTER TABLE public.ultrium_shield_threats RENAME TO safe_shield_threats;
ALTER TABLE public.ultrium_shield_actions RENAME TO safe_shield_actions;

-- Step 2: Update indexes to match new table names (drop old ones first)
DROP INDEX IF EXISTS idx_ultrium_endpoints_user_id;
DROP INDEX IF EXISTS idx_ultrium_endpoints_status;
DROP INDEX IF EXISTS idx_ultrium_threats_user_id;
DROP INDEX IF EXISTS idx_ultrium_threats_severity;
DROP INDEX IF EXISTS idx_ultrium_threats_detected_at;
DROP INDEX IF EXISTS idx_ultrium_actions_user_id;