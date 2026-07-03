/**
 * DevicesRayBrief — Ray Brief for /app/devices.
 *
 * Pulls a lightweight snapshot from ray_timeline for device-flavored
 * events over the last ~24h and turns it into a first-person summary.
 * Never queries anything sensitive; just event counts and event types.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RayBrief, type RayBriefTone } from '@/components/ray/RayBrief';

interface DeviceEvent {
  event_type: string;
  summary: string | null;
  occurred_at: string;
}

function greetingFor(firstName?: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return firstName
    ? `Good ${period}, ${firstName}.`
    : `Good ${period}.`;
}

export function DevicesRayBrief({ deviceCount }: { deviceCount: number }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<DeviceEvent[] | null>(null);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('ray_timeline')
        .select('event_type, summary, occurred_at')
        .eq('user_id', user.id)
        .or('event_type.ilike.device%,event_type.ilike.session%,event_type.ilike.update%,event_type.ilike.posture%')
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(20);
      if (cancelled) return;
      setEvents((data ?? []) as DeviceEvent[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (events === null) {
    return <RayBrief lines={[]} loading />;
  }

  const lines: string[] = [];
  let tone: RayBriefTone = 'ok';

  const deviceLine =
    deviceCount === 0
      ? "You haven't linked a device yet — add one and I'll keep an eye on it."
      : deviceCount === 1
        ? 'I checked your 1 linked device overnight.'
        : `I checked your ${deviceCount} linked devices overnight.`;
  lines.push(deviceLine);

  const updateHits = events.filter((e) => /update|patch|kb\d/i.test(e.event_type + ' ' + (e.summary ?? '')));
  const alertHits = events.filter((e) => /alert|warn|critical|risk/i.test(e.event_type + ' ' + (e.summary ?? '')));

  if (updateHits[0]?.summary) {
    lines.push(updateHits[0].summary);
  }

  if (alertHits.length > 0) {
    tone = 'warn';
    lines.push(
      alertHits.length === 1
        ? '1 device signal is worth a look.'
        : `${alertHits.length} device signals are worth a look.`,
    );
  } else if (deviceCount > 0) {
    lines.push('Nothing requires your attention right now.');
  }

  return <RayBrief greeting={greetingFor(firstName)} lines={lines} tone={tone} />;
}

export default DevicesRayBrief;
