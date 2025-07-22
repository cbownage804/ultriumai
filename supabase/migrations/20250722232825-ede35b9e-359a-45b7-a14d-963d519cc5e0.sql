-- Fix latest scan function to work with actual table structure
DROP FUNCTION IF EXISTS public.get_device_latest_scan(uuid);

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
  WHERE ss.connector_id = (
    SELECT connector_key FROM public.safenet_devices 
    WHERE id = p_device_id
  )
  ORDER BY ss.created_at DESC
  LIMIT 1;
$$;

-- Also fix the alert counts function to have proper search path
DROP FUNCTION IF EXISTS public.get_device_alert_counts(uuid);

CREATE OR REPLACE FUNCTION public.get_device_alert_counts(p_device_id uuid)
RETURNS TABLE(critical bigint, high bigint, medium bigint, low bigint, info bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END), 0) as critical,
    COALESCE(SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END), 0) as high,
    COALESCE(SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END), 0) as medium,
    COALESCE(SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END), 0) as low,
    COALESCE(SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END), 0) as info
  FROM public.safenet_vulnerabilities sv
  WHERE sv.device_id = p_device_id
  AND sv.status IN ('open', 'active');
$$;