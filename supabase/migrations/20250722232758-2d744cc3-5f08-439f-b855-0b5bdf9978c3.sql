-- Fix helper function to get alert counts by device
-- Since security_events doesn't have device_id, we'll use safenet_vulnerabilities and other tables
DROP FUNCTION IF EXISTS public.get_device_alert_counts(uuid);

CREATE OR REPLACE FUNCTION public.get_device_alert_counts(p_device_id uuid)
RETURNS TABLE(critical bigint, high bigint, medium bigint, low bigint, info bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
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