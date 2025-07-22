-- Fix latest scan function with proper type handling
CREATE OR REPLACE FUNCTION public.get_device_latest_scan(p_device_id uuid)
RETURNS TABLE(scan_id uuid, scanned_at timestamptz, devices_found integer, scan_duration integer, scan_type text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ss.id as scan_id,
    ss.created_at as scanned_at,
    ss.devices_found,
    ss.scan_duration,
    'network_scan'::text as scan_type
  FROM public.safenet_scans ss
  JOIN public.safenet_connectors sc ON sc.id = ss.connector_id
  JOIN public.safenet_devices sd ON sd.connector_key = sc.connector_key
  WHERE sd.id = p_device_id
  ORDER BY ss.created_at DESC
  LIMIT 1;
$$;