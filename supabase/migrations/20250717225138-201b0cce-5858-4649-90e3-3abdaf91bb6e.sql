-- Add missing columns to safenet_devices table to match topology processor expectations
ALTER TABLE safenet_devices 
ADD COLUMN IF NOT EXISTS hostname text,
ADD COLUMN IF NOT EXISTS os_family text,
ADD COLUMN IF NOT EXISTS device_role text,
ADD COLUMN IF NOT EXISTS network_segment text,
ADD COLUMN IF NOT EXISTS is_critical boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS uptime_hours integer,
ADD COLUMN IF NOT EXISTS cpu_usage numeric,
ADD COLUMN IF NOT EXISTS memory_usage numeric,
ADD COLUMN IF NOT EXISTS discovery_method text[],
ADD COLUMN IF NOT EXISTS device_metadata jsonb DEFAULT '{}'::jsonb;

-- Update the network_id column to be nullable since topology processor doesn't use it
ALTER TABLE safenet_devices ALTER COLUMN network_id DROP NOT NULL;

-- Rename device_name to match hostname for consistency
-- (We'll keep both for now to avoid breaking existing functionality)
UPDATE safenet_devices SET hostname = device_name WHERE hostname IS NULL;