-- Add missing devices_found column to network_scans table
ALTER TABLE public.network_scans 
ADD COLUMN IF NOT EXISTS devices_found INTEGER NOT NULL DEFAULT 0;