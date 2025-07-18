-- Update scan_type check constraint to allow basic_discovery
ALTER TABLE public.network_scans 
DROP CONSTRAINT network_scans_scan_type_check;

ALTER TABLE public.network_scans 
ADD CONSTRAINT network_scans_scan_type_check 
CHECK (scan_type = ANY (ARRAY['port_scan'::text, 'vulnerability_scan'::text, 'device_discovery'::text, 'basic_discovery'::text]));