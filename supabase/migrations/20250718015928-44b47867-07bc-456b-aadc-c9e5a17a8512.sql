-- First, let's check and fix the safenet_devices table constraints
-- Add unique constraint for IP address and user_id combination
ALTER TABLE public.safenet_devices 
ADD CONSTRAINT safenet_devices_ip_user_unique 
UNIQUE (ip_address, user_id);

-- Update network_scans to mark completed scans as completed
UPDATE public.network_scans 
SET scan_status = 'completed', 
    completed_at = scanned_at,
    updated_at = now()
WHERE scan_status = 'pending' 
AND scanned_at IS NOT NULL;