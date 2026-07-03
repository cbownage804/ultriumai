/**
 * ThreatsRayBrief — Ray Brief for /app/threats.
 *
 * Reads recent scan activity from ray_timeline (event_type ilike scan% /
 * threat% / verdict%) over the last ~48h so Ray can give a short
 * SOC-analyst summary at the top of Threats.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RayBrief, type RayBriefTone } from '@/components/ray/RayBrief';

interface ThreatEvent {
  event_type: string;
  summary: string | null;
  occurred_at: string;
}

function greetingFor(firstName?: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return firstName ? `Good ${period}, ${firstName}.` : `Good ${period}.`;
}

export function ThreatsRayBrief() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ThreatEvent[] | null>(null);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('ray_timeline')
        .select('event_type, summary, occurred_at')
        .eq('user_id', user.id)
        .or('event_type.ilike.scan%,event_type.ilike.threat%,event_type.ilike.verdict%,event_type.ilike.investigation%')
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(30);
      if (cancelled) return;
      setEvents((data ?? []) as ThreatEvent[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (events === null) return <RayBrief lines={[]} loading />;

  const malicious = events.filter((e) => /malicious|critical|phish/i.test(e.event_type + ' ' + (e.summary ?? '')));
  const suspicious = events.filter((e) => /suspicious|warn/i.test(e.event_type + ' ' + (e.summary ?? '')));
  const scanned = events.filter((e) => /scan|verdict/i.test(e.event_type));

  const lines: string[] = [];
  let tone: RayBriefTone = 'ok';

  if (scanned.length === 0) {
    lines.push('Nothing has come across my desk in the last 48 hours.');
    lines.push('Send me anything suspicious — a URL, a file, or a forwarded email — and I\u2019ll take a look.');
    return <RayBrief greeting={greetingFor(firstName)} lines={lines} tone={tone} />;
  }

  lines.push(
    scanned.length === 1
      ? 'I reviewed 1 item you submitted in the last 48 hours.'
      : `I reviewed ${scanned.length} items you submitted in the last 48 hours.`,
  );

  if (malicious.length > 0) {
    tone = 'critical';
    lines.push(
      malicious.length === 1
        ? '1 came back malicious — worth your attention now.'
        : `${malicious.length} came back malicious — worth your attention now.`,
    );
  } else if (suspicious.length > 0) {
    tone = 'warn';
    lines.push(
      suspicious.length === 1
        ? '1 looked suspicious. I flagged it for review.'
        : `${suspicious.length} looked suspicious. I flagged them for review.`,
    );
  } else {
    lines.push('All clear — nothing hostile made it through.');
  }

  return <RayBrief greeting={greetingFor(firstName)} lines={lines} tone={tone} />;
}

export default ThreatsRayBrief;
