-- Add missing connector_key column to safenet_devices table
ALTER TABLE safenet_devices 
ADD COLUMN IF NOT EXISTS connector_key text;