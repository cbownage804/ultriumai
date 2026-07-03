/**
 * IntelligenceRayBrief — Ray Brief for /app/intelligence (the hub).
 *
 * Summarizes intelligence activity for the week: investigations run,
 * how many closed, how many still open, and highlights any active
 * campaign / case Ray is watching. Data comes from the same tables the
 * hub already queries.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RayBrief, type RayBriefTone } from '@/components/ray/RayBrief';

interface Snapshot {
  investigationsThisWeek: number;
  investigationsComplete: number;
  investigationsOpen: number;
  reportsReady: number;
}

function greetingFor(firstName?: string): string {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return firstName ? `Good ${period}, ${firstName}.` : `Good ${period}.`;
}

export function IntelligenceRayBrief() {
  const { user } = useAuth();
  const [snap, setSnap] = useState<Snapshot | null>(null);

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [invs, reports] = await Promise.all([
        supabase
          .from('ray_investigations')
          .select('id, status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since),
        supabase
          .from('ray_board_reports')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'complete'),
      ]);
      if (cancelled) return;

      const investigations = (invs.data ?? []) as Array<{ status: string }>;
      const complete = investigations.filter((r) => r.status === 'complete').length;
      const open = investigations.length - complete;

      setSnap({
        investigationsThisWeek: investigations.length,
        investigationsComplete: complete,
        investigationsOpen: open,
        reportsReady: (reports.data ?? []).length,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (snap === null) return <RayBrief lines={[]} loading />;

  const lines: string[] = [];
  let tone: RayBriefTone = 'ok';

  if (snap.investigationsThisWeek === 0) {
    lines.push("You haven't run an investigation this week.");
    lines.push('Paste any URL, IP, hash, or alert and I\u2019ll take it from there.');
    return <RayBrief greeting={greetingFor(firstName)} lines={lines} tone={tone} />;
  }

  lines.push(
    snap.investigationsThisWeek === 1
      ? 'You ran 1 investigation this week.'
      : `You ran ${snap.investigationsThisWeek} investigations this week.`,
  );

  if (snap.investigationsComplete > 0) {
    lines.push(
      snap.investigationsComplete === 1
        ? '1 was closed with a verdict.'
        : `${snap.investigationsComplete} were closed with a verdict.`,
    );
  }

  if (snap.investigationsOpen > 0) {
    tone = 'warn';
    lines.push(
      snap.investigationsOpen === 1
        ? '1 is still open and waiting on you.'
        : `${snap.investigationsOpen} are still open and waiting on you.`,
    );
  } else if (snap.reportsReady > 0) {
    lines.push(
      snap.reportsReady === 1
        ? '1 board report is ready to export.'
        : `${snap.reportsReady} board reports are ready to export.`,
    );
  }

  return <RayBrief greeting={greetingFor(firstName)} lines={lines} tone={tone} />;
}

export default IntelligenceRayBrief;
