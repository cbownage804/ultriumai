/**
 * ModuleRayBrief — generic Ray Brief for pages that don't need a
 * bespoke data-fetching wrapper. Queries ray_timeline with configurable
 * event_type patterns and composes 1–3 first-person lines.
 *
 * Used by Compliance, Malware Analysis, Log Analysis, Attack Paths, and
 * Graph. Devices, Threats, Intelligence Hub, and Investigations keep
 * their dedicated briefs.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RayBrief, type RayBriefTone } from './RayBrief';

interface Props {
  /** ilike patterns joined into an .or() clause, e.g. 'event_type.ilike.compliance%' */
  eventPatterns: string[];
  /** Hours to look back. Default 48. */
  windowHours?: number;
  /** Rendered when Ray has nothing to report. */
  idleLines: string[];
  /**
   * Build the lines Ray shows when at least one event exists.
   * Receives counts + the raw events for advanced tone decisions.
   */
  composer: (ctx: {
    events: Array<{ event_type: string; summary: string | null; occurred_at: string }>;
    firstName: string;
  }) => { lines: string[]; tone?: RayBriefTone };
}

function greetingFor(firstName?: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return firstName ? `Good ${period}, ${firstName}.` : `Good ${period}.`;
}

export function ModuleRayBrief({ eventPatterns, windowHours = 48, idleLines, composer }: Props) {
  const { user } = useAuth();
  const [events, setEvents] = useState<
    Array<{ event_type: string; summary: string | null; occurred_at: string }> | null
  >(null);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
      const orClause = eventPatterns.join(',');
      const { data } = await supabase
        .from('ray_timeline')
        .select('event_type, summary, occurred_at')
        .eq('user_id', user.id)
        .or(orClause)
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(30);
      if (cancelled) return;
      setEvents((data ?? []) as typeof events extends null ? never : any);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (events === null) return <RayBrief lines={[]} loading />;

  if (events.length === 0) {
    return <RayBrief greeting={greetingFor(firstName)} lines={idleLines} tone="ok" />;
  }

  const { lines, tone = 'ok' } = composer({ events, firstName });
  return <RayBrief greeting={greetingFor(firstName)} lines={lines} tone={tone} />;
}

export default ModuleRayBrief;
