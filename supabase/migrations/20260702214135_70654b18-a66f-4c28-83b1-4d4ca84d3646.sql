
-- Extend release catalog
ALTER TABLE public.wrayth_agent_release
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'stable',
  ADD COLUMN IF NOT EXISTS download_url text,
  ADD COLUMN IF NOT EXISTS min_supported_version text,
  ADD COLUMN IF NOT EXISTS is_rollout_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.wrayth_agent_release
  DROP CONSTRAINT IF EXISTS wrayth_agent_release_channel_check;
ALTER TABLE public.wrayth_agent_release
  ADD CONSTRAINT wrayth_agent_release_channel_check
  CHECK (channel IN ('stable','beta','internal'));

CREATE INDEX IF NOT EXISTS wrayth_agent_release_channel_idx
  ON public.wrayth_agent_release (channel, is_latest, released_at DESC);

-- Make the catalog readable (installers, device UI both need it)
DROP POLICY IF EXISTS "release catalog is public" ON public.wrayth_agent_release;
CREATE POLICY "release catalog is public"
  ON public.wrayth_agent_release FOR SELECT
  USING (true);
GRANT SELECT ON public.wrayth_agent_release TO anon, authenticated;

-- Per-device channel assignment + update tracking
ALTER TABLE public.wrayth_devices
  ADD COLUMN IF NOT EXISTS release_channel text NOT NULL DEFAULT 'stable',
  ADD COLUMN IF NOT EXISTS last_update_check_at timestamptz;

ALTER TABLE public.wrayth_devices
  DROP CONSTRAINT IF EXISTS wrayth_devices_release_channel_check;
ALTER TABLE public.wrayth_devices
  ADD CONSTRAINT wrayth_devices_release_channel_check
  CHECK (release_channel IN ('stable','beta','internal'));

-- Helper: latest release for a given channel
CREATE OR REPLACE FUNCTION public.get_latest_agent_release(_channel text)
RETURNS TABLE (
  version text,
  installer_build text,
  download_url text,
  released_at timestamptz,
  notes text,
  is_rollout_paused boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.version, r.installer_build, r.download_url, r.released_at, r.notes, r.is_rollout_paused
  FROM public.wrayth_agent_release r
  WHERE r.channel = _channel
  ORDER BY r.is_latest DESC, r.released_at DESC
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_latest_agent_release(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_latest_agent_release(text) TO anon, authenticated, service_role;

-- Seed: ensure a stable 0.2.1 entry exists and is marked latest for its channel
INSERT INTO public.wrayth_agent_release (version, installer_build, channel, is_latest, notes, released_at)
VALUES ('0.2.1', '0.2.1', 'stable', true,
        'Hardening + safety pass: risk-tiered actions, preflight guards, before/after state snapshots.',
        now())
ON CONFLICT DO NOTHING;

-- Any older stable entries lose "latest" if a newer one exists
UPDATE public.wrayth_agent_release r
SET is_latest = false
WHERE channel = 'stable'
  AND is_latest = true
  AND version <> (
    SELECT version FROM public.wrayth_agent_release
    WHERE channel = 'stable'
    ORDER BY released_at DESC
    LIMIT 1
  );

-- Existing devices default to the stable channel (already the column default, but explicit for clarity)
UPDATE public.wrayth_devices SET release_channel = 'stable' WHERE release_channel IS NULL;
