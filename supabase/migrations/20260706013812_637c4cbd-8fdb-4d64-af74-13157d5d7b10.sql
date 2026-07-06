-- Sweep stale Wrayth devices: if last_seen_at is older than 15 minutes and
-- the device isn't already revoked, mark it revoked so it disappears from
-- the dashboard (which already filters `revoked_at IS NULL`). This handles
-- the case where the Windows uninstaller's best-effort POST to
-- agent-uninstall didn't reach us (offline, blocked, config already wiped).
CREATE OR REPLACE FUNCTION public.sweep_stale_wrayth_devices(stale_minutes int DEFAULT 15)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected int;
BEGIN
  UPDATE public.wrayth_devices
     SET revoked_at = now()
   WHERE revoked_at IS NULL
     AND last_seen_at IS NOT NULL
     AND last_seen_at < now() - make_interval(mins => stale_minutes);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sweep_stale_wrayth_devices(int) TO authenticated, service_role;

-- Schedule the sweep every 5 minutes via pg_cron.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'wrayth-devices-stale-sweep') THEN
    PERFORM cron.unschedule('wrayth-devices-stale-sweep');
  END IF;
  PERFORM cron.schedule(
    'wrayth-devices-stale-sweep',
    '*/5 * * * *',
    $cron$SELECT public.sweep_stale_wrayth_devices(15);$cron$
  );
END $$;